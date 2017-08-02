var map;
var infowindow;

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
}

function placeServiceCallback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
}