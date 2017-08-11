function Place(placeData) {
    this.location = placeData.location;
    this.name = placeData.name;
    this.id = placeData.id;
}

function ViewModel() {
    var that = this;
    this.map = null;
    this.bounds = null;
    this.infowindow = null;
    this.places = [];
    this.markers = [];
    this.displayedPlaceList = ko.observableArray([]);
    this.filterStr = ko.observable("");

    //when search text change, hide the other list item and corresponding markers
    this.filterStr.subscribe(function (value) {
        that.displayedPlaceList.removeAll();
        if (value !== "") {
            that.places.forEach(function (ele, index, arr) {
                if (ele.name.indexOf(value) >= 0) {
                    that.displayedPlaceList.push(ele);
                }
            });
        } else {
            that.places.forEach(function (ele, index, arr) {
                that.displayedPlaceList.push(ele);
            });
        }

        that.hideAllMarkers();
        if (that.displayedPlaceList() !== 0) {
            that.bounds = new google.maps.LatLngBounds();
            var tempMarker;
            for (var i = 0; i < that.displayedPlaceList().length; i++) {
                tempMarker = that.showSelectedMarker(that.displayedPlaceList()[i].id);
                that.bounds.extend(tempMarker.position);
            }
            that.map.fitBounds(that.bounds);
        }
    });

    //toggle open class when clicking the breadcrumb
    this.toggleNav = function (vm, e) {
        $("nav").toggleClass("open");
        e.stopPropagation();
    };

    //remove open class when clicking other spaces in the main part
    this.closeNav = function () {
        $("nav").removeClass("open");
    };

    //click handler of list item
    //this function will only show the selected marker on the map and populate info window
    this.selectPlace = function (place) {
        var currentMarker;
        for (var i = 0; i < that.markers.length; i++) {
            currentMarker = that.markers[i];
            if (currentMarker.placeId === place.id) {
                that.animateMarker(currentMarker);
                that.populateInfoWindow(currentMarker, that.infowindow);
            }
        }
    };

    // hide all markers on the map
    this.hideAllMarkers = function () {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
        }
    };

    // show selected marker based on placeId
    this.showSelectedMarker = function (placeId) {
        for (var i = 0; i < this.markers.length; i++) {
            if (this.markers[i].placeId === placeId) {
                this.markers[i].setMap(that.map);
                return this.markers[i];
            }
        }
    };

    // initially load google map
    this.initMap = function () {
        var ShanghaiGovernment = { lat: 31.230429, lng: 121.473692 };
        this.map = new google.maps.Map(document.getElementById("map"), {
            zoom: 13,
            center: ShanghaiGovernment
        });

        this.infowindow = new google.maps.InfoWindow();
        this.bounds = new google.maps.LatLngBounds();
        // call PlaceService to get place data
        var service = new google.maps.places.PlacesService(this.map);
        service.nearbySearch({
            location: ShanghaiGovernment,
            radius: 10000,
            type: ['park']
        }, this.placeServiceCallback);

        //make google map responsive
        var resizeTimeout;
        google.maps.event.addDomListener(window, "resize", function () {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(function () {
                that.map.setCenter(ShanghaiGovernment);
            }, 250);
        });
    };

    // callback function of PlacesService.nearbySearch
    // save data to the model
    this.placeServiceCallback = function (results, status) {
        var tempPlace = null;
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                tempPlace = new Place({
                    location: results[i].geometry.location,
                    name: results[i].name,
                    id: i
                });
                that.places.push(tempPlace);
                that.displayedPlaceList.push(tempPlace);
                that.createMarker(tempPlace);
            }
        } else {
            console.error(status + ": Fail to call PlaceService!");
            alert(status + ": Fail to call PlaceService!");
        }
    };

    // initially place the marker on the map
    this.createMarker = function (place) {
        var marker = new google.maps.Marker({
            map: that.map,
            position: place.location,
            title: place.name,
            placeId: place.id,
            animation: google.maps.Animation.DROP
        });
        this.bounds.extend(marker.position);
        this.map.fitBounds(this.bounds);
        this.markers.push(marker);
        google.maps.event.addListener(marker, 'click', function () {
            that.animateMarker(marker);
            that.populateInfoWindow(marker, that.infowindow);
        });
    };

    // Marker animation: Bounce
    this.animateMarker = function (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null)
        }, 2000);

    };

    // populate infowindow on marker
    // call third party api (foursquare) to show additional info on the infowindow
    this.populateInfoWindow = function (marker, infoWindow) {
        if (this.infowindow.marker != marker) {
            this.infowindow.setContent('');
            this.infowindow.marker = marker;

            this.infowindow.addListener('closeclick', function () {
                that.infowindow.marker = null;
            });
            // use Foursquare API to get mode Venue Data
            // TODO: return the Venue data and set infoWindowContent in another function
            var getVenueData = function (lan_lng) {
                var url = "https://api.foursquare.com/v2/venues/search";
                var baseVenueURL = "https://api.foursquare.com/v2/venues/";
                var v_param = "?v=20170801";
                var ll = lan_lng ? lan_lng : "31.230429,121.473692";
                var client_id = "FEPJ53REVS0FJ4GRY2ERV5VK0R1G00RLLOXLEGMPXGWRDPDZ";
                var client_secret = "RZN5VG4VVG2IM4ZDWYAYG3OU33UX5T2OV2FGSGZ0TOROTDRN";
                var clien_id_secret_param = "&client_id=" + client_id + "&client_secret=" + client_secret;
                var venueData = {};

                that.infowindow.setContent('<h3>' + marker.title + '</h3>');
                url = url + v_param + "&ll=" + ll + clien_id_secret_param;
                url = encodeURI(url);
                $.ajax({
                    url: url,
                    method: "GET"
                }).then(function (data) {
                    var venue = data.response.venues[0];
                    var id = venue.id;
                    var venueURL = baseVenueURL + id + v_param + clien_id_secret_param;
                    venueURL = encodeURI(venueURL);
                    return $.ajax({
                        url: venueURL,
                        method: "GET"
                    });
                }).then(function (data) {
                    var item = data.response.venue;
                    var i = 0;
                    var tip = "";
                    var photo = "";
                    var photoSize = "200x150";
                    venueData.name = item.name;
                    var tempHTML = "";
                    var tips = item.tips.groups[0].items;
                    if (tips.length > 0) {
                        venueData.topTips = tips;
                        tempHTML += '<h4>Tips from Foursquare:</h4>';
                        // $("#foursquare").append($(document.createElement("h4")).text("Tips from Foursquare:"));
                        for (i = 0; i < venueData.topTips.length; i++) {
                            tempHTML += '<p>' + venueData.topTips[i].text + '</p>';
                            // tip = $(document.createElement("p")).text(venueData.topTips[i].text);
                            // $("#foursquare").append(tip);
                        }
                    }
                    if (item.bestPhoto) {
                        venueData.photos = item.bestPhoto;
                        var url = venueData.photos.prefix + photoSize + venueData.photos.suffix;
                        tempHTML += '<img src=' + encodeURI(url) + '>'
                        // photo = $(document.createElement("img")).attr('src', encodeURI(url));
                        // $("#foursquare").append(photo);
                    }
                    tempHTML = '<div>' + tempHTML + '</div>';
                    that.infowindow.setContent(that.infowindow.getContent() + tempHTML);
                }).fail(function (xhr, status) {
                    console.log(status + ':' + xhr);
                    alert(status + ':' + xhr);
                    return null;
                });
            };

            var ll = marker.position.lat() + "," + marker.position.lng();
            getVenueData(ll);
            this.infowindow.open(this.map, marker);
        }
    };

    //error handler for loading google map api
    this.googleMapError = function (ele, event) {
        alert(event.type.toUpperCase() + ": Can not load Google Map!");
    };
}
var viewModel = new ViewModel();
ko.applyBindings(viewModel);