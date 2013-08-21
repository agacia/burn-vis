var geocoder
var map;
var svg;
var mapProvider;
var strokeWidthNormal = 2
var strokeWidthBold = 10
var mapDiv
brcLatLng = [-119.23745,40.75471]
sfLatLng = [-122.4167,37.7833]
var collection = []


function project(x) {
    // x = [lat, lng]
  latlng = new L.LatLng(x[1], x[0])
  var point = map.latLngToLayerPoint(latlng);
    return [point.x, point.y];
}

function updateLayers() {
  var g = d3.select("#cs_layer")
  
  var bounds = d3.geo.bounds(collection),
      path = d3.geo.path().projection(project);

  var feature = g.selectAll("path").remove()
  var feature = g.selectAll("path")
      .data(collection.features)
    .enter().append("path");

  map.on("viewreset", reset);
  reset();

  // Reposition the SVG to cover the features.
  function reset() {
    var bottomLeft = project(bounds[0]),
        topRight = project(bounds[1]);

    svg .attr("width", topRight[0] - bottomLeft[0])
        .attr("height", bottomLeft[1] - topRight[1])
        .style("margin-left", bottomLeft[0] + "px")
        .style("margin-top", topRight[1] + "px");

    g   .attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

    feature.attr("d", path);
    }
}

function showLayers() {
  // create svg group element 
  defs = svg.append("defs")
  // defs.append("pattern").append("image").attr("xlink:href", url('images/fire.jpg'))
  var g = svg.append("g").attr("class", "leaflet-zoom-hide route");
  g.attr("id", "cs_layer")
  // brc = project(brcLatLng)
  // svg.append("image")
  //   .attr("xlink:href", "../images/fire.jpg")
  //   .attr("id","svg_img")
  //   .attr("width", 200)
  //   .attr("height", 200)
  //   .attr("x", brc[0])
  //   .attr("y", brc[1])

  var bounds = d3.geo.bounds(collection),
      path = d3.geo.path().projection(project);

  var feature = g.selectAll("path").remove()
  var feature = g.selectAll("path")
      .data(collection.features)
    .enter().append("path");

  map.on("viewreset", reset);
  reset();

  // Reposition the SVG to cover the features.
  function reset() {
    var bottomLeft = project(bounds[0]),
        topRight = project(bounds[1]);

    svg .attr("width", topRight[0] - bottomLeft[0])
        .attr("height", bottomLeft[1] - topRight[1])
        .style("margin-left", bottomLeft[0] + "px")
        .style("margin-top", topRight[1] + "px");

    g   .attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

    feature.attr("d", path);
    // feature.attr("fill", "url('images/fire.jpg')")
  }
}

function setMapView(viewX, viewY, zoom) {
	if (mapProvider == "leaflet") {
		map.setView(new L.LatLng(viewY, viewX),zoom);
	}
	
}

function initializeMap(mapId, mapProviderType, layerType) {
    mapProvider = mapProviderType;
    var overlayPane;
    if (mapProvider == "leaflet") {
    	var layer;
    	map = new L.Map(mapId);
	    if (layerType == "osm") {
          var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          var osmAttrib='Map data © OpenStreetMap contributors';
  		    layer = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 16, attribution: osmAttrib}); 
  		}
  		if (layerType == "stamen.toner") {
  			layer = new L.StamenTileLayer("toner");
  		}
  		if (layerType == "stamen.terrain") {
  			layer = new L.StamenTileLayer("terrain");
  		}
  		if (layerType == "stamen.watercolor") {
  			layer = new L.StamenTileLayer("watercolor");
  		}
  		map.addLayer(layer);
  		// ad d3 svg overlay
      overlayPane = d3.select(map.getPanes().overlayPane);
      svg = overlayPane.append("svg");
      mapDiv = $("#"+mapId)
  	} 
}

function codeAddress() {
  var address = $('#address').val();
  console.log(address)
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      sourcePoint = [results[0].geometry.location.nb, results[0].geometry.location.mb]
      console.log(sourcePoint)
      feature = {"type":"Feature","id":"06","properties":{"name":"California2"},"geometry":{"type":"LineString","coordinates":[[-119.23745,40.75471],sourcePoint]}}
      collection.features.push(feature); 
      console.log("new collection", collection)
      updateLayers()
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

var greenIcon = L.icon({
    iconUrl: 'images/burnman.gif',

    iconSize:     [69, 69], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [20, 50], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [-0, -0] // point from which the popup should open relative to the iconAnchor
});

window.onload = function() {
  geocoder = new google.maps.Geocoder();
  $("#burnBtn").click(function() {
    codeAddress();
  });
  $("#address").keyup(function(event){
    if(event.keyCode == 13){
        $("#burnBtn").click();
    }
  });
  initializeMap("tracemap", "leaflet", "stamen.watercolor");
  setMapView(-119.23745,40.75471,3)
  brc = project(brcLatLng)
  var circle = L.circle([40.75471,-119.23745,3], 500, {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5
  }).addTo(map);
  var marker = L.marker([40.75471,-119.23745],{icon: greenIcon}).addTo(map);
  var jsonPath1 = "data/traces-polygons.json"
  var jsonPath2 = "data/traces.json"
  // d3.json(jsonPath1, function(data) {
  //   showLayers(data)
  // });
  d3.json(jsonPath2, function(data) {
    collection = data;
    showLayers()
  });
  
}

