
      // this variable will collect the html which will eventually be placed in the side_bar 
      var side_bar_html = ""; 
    
      // arrays to hold copies of the markers and html used by the side_bar 
      // because the function closure trick doesnt work there 
      var gmarkers = []; 

     // global "map" variable
      var map = null;
      var circle = null;
      var geocoder = new google.maps.Geocoder();

// A function to create the marker and set up the event window function 
function createMarker(latlng, name, html) {
    var contentString = html;
    var marker = new google.maps.Marker({
        position: latlng,
        // map: map,
        title: name,
        //name: name,
        zIndex: Math.round(latlng.lat()*-100000)<<5
        });

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString); 
        infowindow.open(map,marker);
        });
    // save the info we need to use later for the side_bar
    gmarkers.push(marker);
    // add a line to the side_bar html
    side_bar_html += '<a href="javascript:myclick(' + (gmarkers.length-1) + ')">' + name + '<\/a><br>';
}
 
// This function picks up the click and opens the corresponding info window
function myclick(i) {
  google.maps.event.trigger(gmarkers[i], "click");
}

function initialize() {
      // If there are any parameters at eh end of the URL, they will be in  location.search
      // looking something like  "?marker=3"
 
      // skip the first character, we are not interested in the "?"
      var query = location.search.substring(1);
 
      // split the rest at each "&" character to give a list of  "argname=value"  pairs
      var pairs = query.split("&");
      for (var i=0; i<pairs.length; i++) {
        // break each pair at the first "=" to obtain the argname and value
	var pos = pairs[i].indexOf("=");
	var argname = pairs[i].substring(0,pos).toLowerCase();
	var value = pairs[i].substring(pos+1).toLowerCase();
 
        // process each possible argname  -  use unescape() if theres any chance of spaces
        if (argname == "radius") {
          document.getElementById("radius").value = unescape(value);
          codeAddress();
        }
        if (argname == "address") {
          document.getElementById("address").value = unescape(value);
          codeAddress();
        }
      }
  // create the map
  var myOptions = {
    zoom: 8,
    center: new google.maps.LatLng(43.907787,-79.359741),
    mapTypeControl: true,
    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
    navigationControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }

  map = new google.maps.Map(document.getElementById("map_canvas"),
                                myOptions);
//  google.maps.event.addListener(map, 'bounds_changed', makeSidebar);
//  google.maps.event.addListener(map, 'center_changed', makeSidebar);

  google.maps.event.addListener(map, 'click', function() {
    infowindow.close();
  });

  // Read the data from example.xml
  downloadUrl("cga-3_gndc_harvard_edu_cluster.xml", function(doc) {
    var xmlDoc = xmlParse(doc);
    var markers = xmlDoc.documentElement.getElementsByTagName("marker");
    for (var i = 0; i < markers.length; i++) {
      // obtain the attribues of each marker
      var lat = parseFloat(markers[i].getAttribute("lat"));
      var lng = parseFloat(markers[i].getAttribute("lng"));
      var point = new google.maps.LatLng(lat,lng);
      var id = markers[i].getAttribute("id");
      var country = markers[i].getAttribute("country");
      var html="<b>"+country+"</b><br>"+id;
      // create the marker
      var marker = createMarker(point,country+" "+id,html);
    }
    // put the assembled side_bar_html contents into the side_bar div
    document.getElementById("side_bar").innerHTML = side_bar_html;
  });
}

function makeSidebar() {
   side_bar_html = "";
   for (var i=0; i < gmarkers.length; i++){
     if (map.getBounds().contains(gmarkers[i].getPosition())) {
       // add a line to the side_bar html
       side_bar_html += '<a href="javascript:myclick(' + i + ')">' + gmarkers[i].title + '<\/a><br>';
     }
   }
   // put the assembled side_bar_html contents into the side_bar div
   document.getElementById("side_bar").innerHTML = side_bar_html;
}
        

      function codeAddress() {
        var address = document.getElementById('address').value;
        var radius = parseInt(document.getElementById('radius').value, 10)*1000;
        geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            side_bar_html = "";
            map.setCenter(results[0].geometry.location);
            var searchCenter = results[0].geometry.location;
            /*
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });
            */
            if (circle) circle.setMap(null);
            circle = new google.maps.Circle({center:searchCenter,
                                             radius: radius,
                                             fillOpacity: 0.35,
                                             fillColor: "#FF0000",
                                             map: map});
            var bounds = new google.maps.LatLngBounds();
	    var foundMarkers = 0;
            for (var i=0; i<gmarkers.length;i++) {
              if (google.maps.geometry.spherical.computeDistanceBetween(gmarkers[i].getPosition(),searchCenter) < radius) {
                bounds.extend(gmarkers[i].getPosition())
                gmarkers[i].setMap(map);
                // add a line to the side_bar html
                side_bar_html += '<a href="javascript:myclick(' + i + ')">' + gmarkers[i].title + '<\/a><br>';
		foundMarkers++;
              } else {
                gmarkers[i].setMap(null);
              }
            }
            // put the assembled side_bar_html contents into the side_bar div
            document.getElementById("side_bar").innerHTML = side_bar_html;
            if (foundMarkers > 0) {
              map.fitBounds(bounds);
	    } else {
              map.fitBounds(circle.getBounds());
            }
            // makeSidebar();
            // google.maps.event.addListenerOnce(map, 'bounds_changed', makeSidebar);

          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });
      }
    var locations = file_get_contents("foodbanks.json");
    var infowindow = new google.maps.InfoWindow();

    var marker, i;

    for (i = 0; i < locations.length; i++) {  
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(locations[i][1], locations[i][2]),
        map: map
      });

      google.maps.event.addListener(marker, 'click', (function(marker, i) {
        return function() {
          infowindow.setContent(locations[i][0]);
          infowindow.open(map, marker);
        }
      })(marker, i));
    }
// 3.0437318334217314, 101.64207130064379 <-- Petaling, zoom=18
// 3.129753736417666, 101.59581621196189 <-- Petaling Jaya, zoom=13
function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var latlongvalue = position.coords.latitude + ","
    + position.coords.longitude;
    var img_url = "https://maps.googleapis.com/maps/api/staticmap?center="
    +latlongvalue+"&amp;zoom=14&amp;size=400x300&amp";key
    ="AIzaSyAa8HeLH2lQMbPeOiMlM9D1VxZ7pbGQq8o";
    document.getElementById("mapholder").innerHTML =
    "<img src='"+img_url+"'>";
 }
 function errorHandler(err) {
    if(err.code == 1) {
       alert("Error: Access is denied!");
    } else if( err.code == 2) {
       alert("Error: Position is unavailable!");
    }
 }
 function getLocation(){
    if(navigator.geolocation){
       // timeout at 60000 milliseconds (60 seconds)
       var options = {timeout:60000};
       navigator.geolocation.getCurrentPosition
       (showLocation, errorHandler, options);
    } else{
       alert("Sorry, browser does not support geolocation!");
    }
 }