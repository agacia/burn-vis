// monitor settings 
var _realTimeFrequency = 5000;
var _isPlaying = false;
var _chartSpecPath = "vega/vega_spec.json"
var _chartVANETSpecPath = "vega/vega_spec_vanet2.json"
var _selectedNetwork = {}
var _selectedRoute = {}
var _loadedData = null

var startMonitoringText = "Start monitoring to see the performance on route "
var monitoringText = "Performance on route "

var isPlaying = function() {
    // var buttonId = $("#playButtons").find('.active').attr("id")
    // console.log(buttonId)
    // return buttonId=="startPlayingButton"
    return _isPlaying
};

function loadVanets(spec) {
    // vg.parse.spec(spec, function(chart) { chart({el:"#vis_vanets"}).update(); });

}

window.onload = function() {

    loadVanets(_chartVANETSpecPath);

	initializeSelectedNetwork();
    initializeDate(new Date());
    initializePlayer(false);
    initializeTimeSlider();

    initializeMap("monitor_map", "leaflet", "stamen.toner");
    // initializeMap("monitor_map", "modestmap", "stamen.toner");
    
    loadData()
}

function initializeSelectedNetwork() {
    loadSelectedNetwork();
    // $('[name="network_id"]').change(function(){
    $('[name="network_id"]').change(function(){
        loadSelectedNetwork();
    });
}

function initializeDate(date) {
    $('#datepicker').datepicker()
    $('#datepicker').datepicker('setValue', date)
}

function initializePlayer(isPlaying) {
    _isPlaying = isPlaying;
    if (_isPlaying) {
        $("#startPlayingButton").addClass('disabled');
        $("#stopPlayingButton").removeClass('disabled');
    }
    else {
        $("#startPlayingButton").removeClass('disabled');
        $("#stopPlayingButton").addClass('disabled');
    }
    $("#startPlayingButton").click(function() {
        $("#startPlayingButton").button('loading');
        $("#stopPlayingButton").removeClass('disabled');
        // $("#startPlayingButton").removeClass('disabled');
        _isPlaying = true;
        loadData();
        $("#vis_title").text(monitoringText + _selectedRoute.route_name)
    });
    $("#stopPlayingButton").click(function() {
        stopMonitoring()
    });
}

function stopMonitoring() {
    $("#startPlayingButton").button('reset');
    $("#stopPlayingButton").addClass('disabled');
    _isPlaying = false;
    $("#vis_title").text(startMonitoringText + _selectedRoute.route_name)
    _loadedData = null
}

function initializeTimeSlider() {
    var options = {"min": 0, "max" : 24, "step":1}
    $('#slider').slider(options)
    $('#slider').slider('setValue', 0)
    $('.slider').width("100%")
}

function showAlert(type, msg) {
    var htmlAlert ='<div class="alert '+type+'"><button type="button" class="close" data-dismiss="alert">&times;</button><div class="msg">'+msg+'</div></div>';
    $('#alert_placeholder').append(htmlAlert)
}

var loadData = function(datetime) {
    if (isPlaying()) {
        var network_name = $('[name="network_id"]').find("option:selected").val()
        var url = "/loadData/" + network_name + "/"
        if (datetime) {
            datetimestring = ""+datetime.valueOf()+"/"
            url += datetimestring
        }
        d3.json(url, processLoadedData);   
        setTimeout(loadData, _realTimeFrequency);
    }
}

function getMapPerformanceMetrics() {
    // TODO read from checkbox
    return ["speed"]
}

function getRoutePerformanceMetric(routeId) {
    // TODO read from dropdown list
    return "speed"
}

function processLoadedData(response) {
    console.log("Loaded data:")
    console.log(response)
    _loadedData = response
    // show performance on the map 
    // read which performance metrics to show 
    mapMetrics = getMapPerformanceMetrics();
    for (var i in mapMetrics) {
        // TODO show on map 
    }

    // updating contour plor
    updateContourPlot(_selectedRoute, _chartSpecPath)
}

var loadSelectedNetwork = function() {
    stopMonitoring()
    _selectedNetwork.name = $('[name="network_id"]').find("option:selected").val()
    $('span.network_name').text(_selectedNetwork.name);
    var parameters = { "network_name": _selectedNetwork.name }
    var url = "/loadNetwork/" + _selectedNetwork.name
    // $.ajax({ url: url, success: jsonpCallback});
    d3.json(url, processLoadedNetwork);
}

/*
 * Shows loaded project:
 * - links on the map
 * TODO: Show routes, controllers
 */
function processLoadedNetwork(response) {
	console.log("Loaded data: ");
    console.log(response);
    // link_ids = getValues(response, "links", "id")
    // console.log(link_ids)
    var viewX = response.network_data.x_center
    var viewY = response.network_data.y_center
    var zoom = response.network_data.zoom
    setMapView(viewX, viewY, zoom)
  
    for (var i in response.network_data.networks) {
        network = response.network_data.networks[i]
        
        // show links as paths
        _selectedNetwork.links = network.links

        initializeRoutes(_selectedNetwork.routes)

        console.log("_selectedNetwork")
        console.log(_selectedNetwork)
    }

}

function initializeRoutes(routes) {
    // TODO get from the loaded network! 
    _selectedNetwork.routes = [ 
    { 
        "route_id" : "route1", 
        "route_name": "Route 1", 
        "linkIds" : ["-53", "-59", "-63", "-69", "-79", "-80", "-165", "-166", "-170", "-171", "-172", "-173", "-174", "-175", "-176", "-177", "-178", "-179", "-180", "-181", "-182", "-183", "-184", "-185", "-186", "-187", "-188", "-190", "-191", "-192", "-193", "-194", "-195", "-197", "-198", "-199", "-200", "-202", "-203", "-207", "-208", "-210", "-211", "-24", "-27", "-28", "-31", "-34", "-35", "-37"],
        "color": "red"
    },
    { 
        "route_id" : "route1b", 
        "route_name": "Route 1b", 
        "linkIds" : ["-42", "-43", "-44", "-61", "-48", "-90", "-54", "-94", "-96", "-32", "-33", "-167", "-168", "-169", "-201", "-204", "-86", "-205", "-206", "-88", "-93", "-212", "-213", "-214", "-215", "-216", "-217", "-218", "-219", "-220", "-221", "-222", "-223", "-224", "-225", "-226", "-227", "-228", "-229", "-230", "-231", "-232", "-233", "-234", "-235", "-236", "-237", "-238", "-239", "-240", "-241", "-242", "-243", "-244", "-245", "-246", "-247", "-248", "-249", "-250", "-251", "-252", "-253", "-254", "-255", "-256", "-257", "-258", "-259", "-260", "-261", "-262", "-263", "-264", "-265", "-266", "-267", "-268", "-269", "-270", "-271", "-272", "-273", "-274", "-275", "-276", "-277", "-278", "-279", "-280", "-281", "-282", "-283", "-284", "-285", "-286", "-287", "-288", "-289", "-290", "-291", "-292", "-293", "-294", "-295", "-296", "-297", "-298", "-299", "-300", "-301", "-302", "-303", "-304", "-305", "-306", "-307", "-308", "-309", "-310", "-311", "-312", "-313", "-314", "-315", "-316", "-317", "-318", "-319", "-320", "-321", "-322", "-323", "-324", "-325", "-326", "-327", "-328", "-329", "-330", "-331", "-332", "-333", "-334", "-335", "-336", "-337", "-338", "-339", "-340", "-341", "-342", "-343", "-344", "-345", "-346", "-347", "-348", "-349", "-350", "-351", "-352", "-353", "-354", "-355", "-356", "-357", "-358", "-359", "-360", "-361", "-362", "-363", "-364", "-365", "-366", "-367", "-368", "-189", "-196", "-209"] ,
        "color": "blue"
    }
    ]
    for (var i in _selectedNetwork.routes) {
        var route = _selectedNetwork.routes[i]
        route.offsets = []
        var offset = 0
        route.links = []
        for (var i in route.linkIds) {
            var link = getLinkFromNetwork(route.linkIds[i]) 
            link.offset = offset
            route.links.push(link);
            offset = offset + 10
        }
        var collection = {"type":"FeatureCollection", "features":route.links, "route_id": route.route_id, "color":route.color}
        showPaths(collection)
    }
    
    // populates dropdown list with route names
    var routeSelect = d3.select("#route_select");
    routeSelect.selectAll("option").remove()
    routeSelect.selectAll("option").data(_selectedNetwork.routes).enter().append("option")
        .text(function(d) {
            return d.route_name;
        })
        .attr("value", function(d) {
            return d.route_id;
        });

    // select first route in dropdown list
    if (_selectedNetwork.routes) {
        $('#route_select').val(_selectedNetwork.routes[0].route_id);
    }
    $('[name="route_id"]').change(function(){
        loadSelectedRoute();
    });
    loadSelectedRoute();
}

function loadSelectedRoute() {
    var selectedRouteId = $('[name="route_id"]').find("option:selected").val()
    // get route
    for (var i in _selectedNetwork.routes) {
        var route = _selectedNetwork.routes[i]
        if (route.route_id == selectedRouteId) {
            _selectedRoute = route
            break
        }
    } 
    console.log("_selectedRoute")
    console.log(_selectedRoute)
    if (!_loadedData) {
        $("#vis_title").text(startMonitoringText + _selectedRoute.route_name)
    } else {

        $("#vis_title").text(monitoringText + _selectedRoute.route_name)
    }
    updateContourPlot(_selectedRoute, _chartSpecPath)
}

var getLinkFromNetwork = function(linkId) {
    for (var i in _selectedNetwork.links.features) {
        link = _selectedNetwork.links.features[i]
        if (link.properties.id == linkId) {
            return link
        }
    }
}

var updateContourPlot = function(route, specPath) {
    // get performance of route links
    var performances = []
    // var i = 0;
    // while (i++ < 10 ) {
    for (var i in route.links) {
        var link = route.links[i]
        var performance = getLinkPerformanceFromLoadedData(link.properties.id) 
        // TODO remove:
        if (performance) {
            performance.speed = Math.random()*10+25
        }
        link.performance = performance
    }
    d3.json(specPath, function(spec) {
        var chartData = null
        if (_loadedData) {
            chartData = {
                "route": route.links,
            } 
            console.log("chartData")
            console.log(chartData)
            vg.parse.spec(spec, function(chart) { chart({el:"#vis", data: chartData}).update(); });
        }
    });

}

var getLinkPerformanceFromLoadedData = function(linkId) {
    // console.log("linkId " + linkId + ", linkPerformance")
    for (var i in _loadedData) {
        var linkPerformance = _loadedData[i].data
        if (linkPerformance.link_id == linkId) {         
            // console.log(linkPerformance)
            return linkPerformance;
        }
    }
}

var getValues = function(jsonObject, firstKey, secondKey) {
    values = []
    $.each(jsonObject.network_data.networks, function (index, network) {
        $.each(network[firstKey].features, function (data) {
            data = this.properties[secondKey]
            values.push(data)
        });
    });
    return values
}


console.log("I'm a client")