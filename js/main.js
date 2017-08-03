var map;
var infowindow;
var markers = [];

function initMap() {
    var ShanghaiGovernment = { lat: 31.230429, lng: 121.473692 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: ShanghaiGovernment
    });

    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: ShanghaiGovernment,
        radius: 10000,
        type: ['park']
    }, placeServiceCallback);
};

function placeServiceCallback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
};

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name,
        // icon: defaultIcon,
        animation: google.maps.Animation.DROP
    });
    markers.push(marker);
    google.maps.event.addListener(marker, 'click', function () {
        populateInfoWindow(marker, infowindow);
    });
};

function populateInfoWindow(marker, infoWindow) {
    if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;

        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
        function getVenueData(lan_lng) {
            var url = "https://api.foursquare.com/v2/venues/search";
            var v_param = "?v=20170801";
            var ll = lan_lng ? lan_lng : "31.230429,121.473692";
            var client_id = "FEPJ53REVS0FJ4GRY2ERV5VK0R1G00RLLOXLEGMPXGWRDPDZ";
            var client_secret = "RZN5VG4VVG2IM4ZDWYAYG3OU33UX5T2OV2FGSGZ0TOROTDRN";
            var clien_id_secret_param = "&client_id=" + client_id + "&client_secret=" + client_secret;
            var venueData = {};

            infowindow.setContent('<h3>' + marker.title + '</h3><div id="foursquare"></div>');
            url = url + v_param + "&ll=" + ll + clien_id_secret_param;
            url = encodeURI(url);
            $.ajax({
                url: url,
                method: "GET"
            }).then(function (data) {
                var venue = data.response.venues[0];
                var id = venue.id;
                var venueURL = "https://api.foursquare.com/v2/venues/" + id + v_param + clien_id_secret_param;
                return $.ajax({
                    url: venueURL,//"https://api.foursquare.com/v2/venues/4baf0c23f964a520a2e83be3?v=20170801&client_id=FEPJ53REVS0FJ4GRY2ERV5VK0R1G00RLLOXLEGMPXGWRDPDZ&client_secret=RZN5VG4VVG2IM4ZDWYAYG3OU33UX5T2OV2FGSGZ0TOROTDRN"
                    method: "GET"
                });
            }).then(function (data) {
                var item = data.response.venue;
                var i = 0;
                var tip = "";
                var photo = "";
                var address = "";//TODO
                venueData.name = item.name;
                if (item.tips.groups[0].items) {
                    venueData.topTips = item.tips.groups[0].items;
                    $("#foursquare").append($(document.createElement("h4")).text("Tips from Foursquare:"));
                    for (i = 0; i < venueData.topTips.length; i++) {
                        tip = $(document.createElement("p")).text(venueData.topTips[i].text);
                        $("#foursquare").append(tip);
                    }
                }
                if (item.bestPhoto) {
                    venueData.photos = item.bestPhoto;
                    var url = venueData.photos.prefix + "200x150" + venueData.photos.suffix;
                    photo = $(document.createElement("img")).attr('src', url);
                    $("#foursquare").append(photo);
                }
            }).fail(function (xhr) {
                console.log('error', xhr);
                return null;
            });
        };

        var ll = marker.position.lat() + "," + marker.position.lng();
        getVenueData(ll);
        infowindow.open(map, marker);
    }
};

