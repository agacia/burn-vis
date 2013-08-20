var map;
var svg;
var mapProvider;
var mapDiv;
var strokeWidthNormal = 2
var strokeWidthBold = 10

function project(x) {
    // x = [lat, lng]
  latlng = new L.LatLng(x[1], x[0])
  var point = map.latLngToLayerPoint(latlng);
    return [point.x, point.y];
}

function showPathsLeafletD3(collection) {
  // create svg group eleent 
  var group = svg.append("g").attr("class", "leaflet-zoom-hide route");
  group.attr("id", collection.route_id)

  // collection.features = collection.features.map(switchFeatures);
  function switchCoords(x) {
  	return [x[1],x[0]]
  }
  function switchFeatures(feature) {
  	feature.geometry.coordinates = feature.geometry.coordinates.map(switchCoords);
  	return feature
  }
  
  var bounds = d3.geo.bounds(collection);
  var path = d3.geo.path().projection(project);  
  var feature = group.selectAll("path")
      .data(collection.features)
      .enter().append("path");
  
  map.on("viewreset", reset);
  reset();

  // Reposition the g to cover the features.
  // TODO refresh after grabbing!
  function reset() {
    svg.attr("width", mapDiv.width())
            .attr("height", mapDiv.height())
            .style("margin-left", 0 + "px")
            .style("margin-top", 0 + "px");

    // var pathBounds = [project(bounds[0]), project(bounds[1])];
    // var height = pathBounds[0][1] - pathBounds[1][1];
    // var width = pathBounds[1][0] - pathBounds[0][0];
  	//group.attr("transform", "translate(" + -pathBounds[0][0] + "," + -pathBounds[1][1] + ")");
    group.attr("transform", "translate(" + 0 + "," + 0 + ")");

    feature.attr("d", path);
    feature.style("stroke", collection.color);
    
    // events
    // mousedown: Triggered by an element when a mouse button is pressed down over it
    // mouseup: Triggered by an element when a mouse button is released over it
    // mouseover: Triggered by an element when the mouse comes over it
    // mouseout: Triggered by an element when the mouse goes out of it
    // mousemove: Triggered by an element on every mouse move over it.
    // click: Triggered by a mouse click: mousedown and then mouseup over an element
    // contextmenu: Triggered by a right-button mouse click over an element.
    // dblclick: Triggered by two clicks within a short time over an element
    feature.on("mouseover", function(d) {
      group.selectAll("path").style("stroke-width", strokeWidthBold)
    })
    feature.on("mouseout", function(d) {
      group.selectAll("path").style("stroke-width", strokeWidthNormal)
    })
    feature.on("click", function(d) {
      // var lala = $('[name="route_id"]').find("option[value='"+group.attr("id")+"']")
      $('#route_select').val(group.attr("id"))
      loadSelectedRoute();
    })

    // custom tooltips
    //var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    // feature.on("mouseover", function(d) {    
    //           div.transition()        
    //               .duration(200)      
    //               .style("opacity", .9);      
    //           div .html("over link " + "<br/>"  + d.properties.id)  
    //               .style("left", (d3.event.pageX) + "px")     
    //               .style("top", (d3.event.pageY - 28) + "px");  
    //       })                  
    //       .on("mouseout", function(d) {       
    //           div.transition()        
    //               .duration(500)      
    //               .style("opacity", 0);   
    //       });

    // twitter bootsrap tooltip
    feature.attr("data-toggle", "tooltip")
    feature.attr("title", function(d) {
      var tooltipText = "Route " + group.attr("id")
      tooltipText += " link: " +  d.properties.id
      return tooltipText
    })
    $("path").tooltip({
      'container': 'body',
      'placement': 'bottom'
    });


  }
}

function showPathsLeaflet(collection) {
	if (collection.features) {
		for (var i in collection.features) {
			var feature = collection.features[i]
			// alert("adding polygon" + feature.geometry.coordinates)
			if (feature.geometry && feature.geometry.type && feature.geometry.type.toString()=="LineString") {
				var polygon = L.polygon(feature.geometry.coordinates).addTo(map);
			}
		}
	}
}

function showPaths(collection) {
  if (mapProvider == "leaflet") {
  	showPathsLeafletD3(collection)
  }
  if (mapProvider == "modestmap") {
    // var location = new MM.Location(x[0], x[1])
    // console.log("location")
    // console.log(location)
    // point = map.locationPoint(location)
    // console.log("point")
    // console.log(point)
    // point = [x[0], x[1]]
    // map.addCallback('drawn', reset);
  }
}

function setMapView(viewX, viewY, zoom) {
	if (mapProvider == "leaflet") {
		map.setView(new L.LatLng(viewY, viewX),zoom);
	}
	if (mapProvider == "modestmap") {
		map.setCenterZoom(new MM.Location(viewX, viewY), zoom);
	}
}

function initializeMap(mapId, mapProviderType, layerType) {
    mapProvider = mapProviderType;
    var overlayPane;
    if (mapProvider == "leaflet") {
    	var layer;
    	map = new L.Map(mapId);
	    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	    var osmAttrib='Map data © OpenStreetMap contributors';
		if (layerType == "osm") {
		    layer = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 16, attribution: osmAttrib}); 
		}
		if (layerType == "stamen.toner") {
			layer = new L.StamenTileLayer("toner");
			map.addLayer(layer) 
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
	else if (mapProvider == "modestmap") {
  //   	// modestmap
  //   	var layer;
		// if (layerType == "osm") {
		//     layer = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 16, attribution: osmAttrib}); 
		// }
		// if (layerType == "stamen.toner") {
		// 	layer = new MM.TemplatedLayer("http://tile.stamen.com/toner/{Z}/{X}/{Y}.png");
		// }
		// if (layerType == "stamen.terrain") {
		// 	layer = new MM.TemplatedLayer("http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png");
		// }
		// if (layerType == "stamen.watercolor") {
		// 	layer = new MM.TemplatedLayer("http://tile.stamen.com/watercolor/{Z}/{X}/{Y}.png");
		// }
		// console.log(mapId)
		// map = new MM.Map('map', layer);
		// console.log(map)
		var dimensions = new MM.Point(600,400);
    	map = new MM.Map("map", new MM.TemplatedLayer("http://tile.stamen.com/toner/{Z}/{X}/{Y}.png"), dimensions);
    
		// overlayPane = d3.select("#overlayPane")
	}
	   
	

    // var marker = L.marker([51.5, -0.09]).addTo(map);

    // var circle = L.circle([51.508, -0.11], 500, {
    //     color: 'red',
    //     fillColor: '#f03',
    //     fillOpacity: 0.5
    // }).addTo(map);

    // var polygon = L.polygon([
    //     [51.509, -0.08],
    //     [51.503, -0.06],
    //     [51.51, -0.047]
    // ]).addTo(map);

    // marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
    // circle.bindPopup("I am a circle.");
    // polygon.bindPopup("I am a polygon.");

    // var popup = L.popup()       

    // function onMapClick(e) {
    //     popup
    //         .setLatLng([51.5, -0.09])
    //         .setContent("You clicked the map at " + e.latlng.toString())
    //         .openOn(map);
    // }
    // map.on('click', onMapClick);
}
