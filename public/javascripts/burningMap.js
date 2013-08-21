function burnBabyBurn() {

    var doc = document.documentElement;
    var width = doc.clientWidth, height = doc.clientHeight;

    var c = document.getElementById("c");
    c.width = width, c.height = height;
    grid_stat = Grid('#map',width,height);
    redraw = foregroundGL(grid_stat.coords, grid_stat.entering, grid_stat.exiting);
    bg = backgroundGL(grid_stat.coords, grid_stat.entering, grid_stat.exiting);
    
    function animationLoop()
    {
        requestAnimationFrame(animationLoop);

        gl.clearColor(0., 0., 0., 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        redrawAllLayers();
        
        grid_stat.dirty = false;
    }
    
    animationLoop();
}

function foregroundGL(tiles, entering, exiting)
{
    // texture size, grid rows/columns, and overall grid count
    var txsz = 2048,
        txgd = Math.floor(txsz / (256 + 2)),
        txct = txgd * txgd;

    var c = document.getElementById('c')
        gl = c.getContext('experimental-webgl');

    function createParticleProgram() {
        var vsource = document.getElementById('shader-vs-px').innerText,
            fsource = document.getElementById('shader-fs-px').innerText,
            program = linkProgram(gl, vsource, fsource);

        program.x_attrib = gl.getAttribLocation(program, 'x');
        program.y_attrib = gl.getAttribLocation(program, 'y');
        program.t_attrib = gl.getAttribLocation(program, 't');
    
        gl.enableVertexAttribArray(program.x_attrib);
        gl.enableVertexAttribArray(program.y_attrib);
        gl.enableVertexAttribArray(program.t_attrib);

        return program;
    }

    var tile_textures = {}; 
    var texture_slots = new Array(3 * 8 * 8);

    var particle_index = 0, particle_count = 60000, particles_per_frame = 1200,
        particle_pos = {}, particle_keys = [], particle_nums = [];

    function createParticleBuffers() {
        particles_xpos_buffer = gl.createBuffer();
        particles_ypos_buffer = gl.createBuffer();
        particles_vx_buffer = gl.createBuffer();
        particles_vy_buffer = gl.createBuffer();
        particles_time_buffer = gl.createBuffer();

        particles_xpos_array = new Float32Array(particle_count);
        particles_ypos_array = new Float32Array(particle_count);
        particles_vx_array = new Float32Array(particle_count);
        particles_vy_array = new Float32Array(particle_count);
        particles_time_array = new Float32Array(particle_count);

        gl.bindBuffer(gl.ARRAY_BUFFER, particles_xpos_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_xpos_array, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, particles_ypos_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_ypos_array, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, particles_vx_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_vx_array, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, particles_vy_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_vy_array, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, particles_time_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_time_array, gl.STATIC_DRAW);
    }

    function setUpViewMatrix(program) {
        var view = gl.getUniformLocation(program, 'view');
        mat4 = new Float32Array([2.0/c.width, 0, 0, 0, 0, -2.0/c.height, 0, 0, 0, 0, 1, 0, -1, 1, 0, 1]);
    
        gl.uniformMatrix4fv(view, false, mat4);
    }

    var particleProgram = createParticleProgram();
    gl.useProgram(particleProgram);
    createParticleBuffers();
    setUpViewMatrix(particleProgram);
    
    var queue = ImageQueue(),
        blank = new Image();
        
    blank.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAANQTFRFZmZmfFaCBAAAAB9JREFUGBntwQENAAAAwqD3T20ON6AAAAAAAAAAAL4NIQAAAQWThvcAAAAASUVORK5CYII=';
    setInterval(function() { queue.process() }, 250);
    
    function tileKey(tile)
    {
        return [tile.z, Math.floor(tile.c), Math.floor(tile.r)].join('/');
    }
    
    function cancelTile(tile)
    {
        var src = 'shttp://tile.stamen.com/toner-lines/'+tileKey(tile)+'.png';

        queue.cancel(src);
    }

    var canvasWidth = 128, pixelPos = {},
        particle_total = 0, inner_total;

    function pullPixelValues(img, key) {
        var c = document.createElement('canvas');
        c.id = 'c'+key;
        c.width = c.height = canvasWidth;
        var ctx = c.getContext("2d");
        ctx.drawImage(img,0,0,canvasWidth,canvasWidth);
        var pixels = ctx.getImageData(0,0,canvasWidth,canvasWidth);

        for (var i = 0; i < pixels.data.length/4; i++) {
            if (pixels.data[i*4+3] != "0") {
                if (!pixelPos[key]) return;
                pixelPos[key]['x'].push((i%canvasWidth)*2);
                pixelPos[key]['y'].push(Math.floor(i*2/canvasWidth));
            }
        }

        inner_total = 0;
        for (var i = 0; i < particle_keys.length; i++ ) {
            particle_nums[i] = inner_total;
            inner_total += pixelPos[particle_keys[i]]['x'].length;
        }
        particle_total = inner_total;
    }
    
    var tileindex = 0;
    
    function loadTile(tile, r, s, t)
    {
        tileindex++;
        var _tileindex = tileindex;
    
        var key = tileKey(tile),
            src = 'http://tile.stamen.com/toner-lines/'+key+'.png';
        
        var onload = function(err, img)
        {
            if(err != undefined)
            {
                return;
            }
        
            if(tile_textures.hasOwnProperty(key))
            {
                tile_textures[key].loaded = true;
                pullPixelValues(img, key);
                redrawAllLayers();
            }
        }
        
        tile_textures[key].loaded = false;
        queue.add(src, onload);
    }
    
    function prioritizeZoom(zoom)
    {
        var match = '/toner-lines/' + zoom.toFixed(0) + '/';
        queue.prioritize(match);
    }
    
    function populateVertexArray(i)
    {
        var x = tiles[i].x,
            y = tiles[i].y,
            w = tiles[i].w,
            h = tiles[i].h,
            off = i * 8;
        
        tiles_vertex_array[off + 0] = x;
        tiles_vertex_array[off + 1] = y;
        tiles_vertex_array[off + 2] = x + w;
        tiles_vertex_array[off + 3] = y;
        tiles_vertex_array[off + 4] = x + w;
        tiles_vertex_array[off + 5] = y + h;
        tiles_vertex_array[off + 6] = x;
        tiles_vertex_array[off + 7] = y + h;
    }

    function redrawTiles()
    {
        for(var i = 0; i < exiting.length; i++)
        {
            cancelTile(exiting[i]);
            var key = tileKey(exiting[i]);
        
            if(tile_textures.hasOwnProperty(key))
            {
                texture_slots[tile_textures[key].slot] = undefined;
                delete tile_textures[key];
                var j = particle_keys.indexOf(key);
                if (j !== -1) {
                    particle_keys.splice(j, 1);
                    particle_nums.splice(j, 1);
                }
            }
        }

        for(var i = 0; i < entering.length; i++)
        {
            var tile = entering[i],
                key = tileKey(tile);
        
            if(tile_textures.hasOwnProperty(key))
            {
                continue;
            }
        
            for(var slot = 0; slot < texture_slots.length; slot++)
            {
                // look for a free texture slot
                if(texture_slots[slot] == undefined)
                {
                    // r: texture target
                    // s, t: column, row
                    var r = Math.floor(slot / txct),
                        s = (1 + (slot % txgd) * 258) / txsz,
                        t = (1 + Math.floor((slot % txct) / txgd) * 258) / txsz;
                    
                    texture_slots[slot] = 1;
                    tile_textures[key] = {tile: tile, slot: slot, r: r, s: s, t: t, loaded: null};
                    pixelPos[key] = pixelPos[key] || {x : [], y : []};
                    particle_keys.push(key);
                    particle_nums.push(0);
                    loadTile(tile, r, s, t);
                    break;
                }
            }
        }
        
        if (tiles[0]) {
            prioritizeZoom(tiles[0].z);
        }
        
        for(var i = 0; i < tiles.length; i++)
        {
            if (tiles[i].z != tiles[0].z) continue;

            tiles[i].key = tileKey(tiles[i]);
        }
    }

    function redrawFire() {
        gl.useProgram(particleProgram);
        
        // additive blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        var scale = d3.scale.linear().domain([0,900]).range([.01,7])

        for(var i = 0; i < particle_count; i++)
        {
            if(particles_time_array[i] > 0)
            {
                particles_time_array[i] += particles_per_frame/particle_count;
                particles_ypos_array[i] -= .15;
            }
        }
        
        for(var i = 0; i < particles_per_frame; i++)
        {
            var theta = Math.random() * 2 * Math.PI,
                indexNum = Math.floor(Math.random() * particle_total),
                p = particle_index,
                tile, tileNum;

            for (var j = particle_nums.length; j >= 0; j--) {
                if (indexNum > particle_nums[j]) {
                    tileNum = j;
                    tile = pixelPos[particle_keys[tileNum]];
                    break;
                }
            }

            var x0 = 0,
                y0 = 0,
                s0 = 256,
                loaded = false;

            for (var j = 0; j < tiles.length; j++) {
                if (tiles[j].key == particle_keys[tileNum]) {
                    x0 = tiles[j].x,
                    y0 = tiles[j].y,
                    s0 = tiles[j].w;
                    loaded = true;
                }
            }
            if (!loaded || !tile) continue;

            // add width and height scaling!!
            var particleNum = Math.floor(Math.random()*tile['x'].length);
            particles_xpos_array[p] = x0 + (tile['x'][particleNum])*(s0/256);
            particles_ypos_array[p] = y0 + (tile['y'][particleNum])*(s0/256);

            // particles_vx_array[p] = 4 * Math.cos(theta);
            particles_vy_array[p] = 4 * Math.sin(theta);
            
            particles_time_array[p] = particles_per_frame/particle_count;
            particle_index = (p + 1) % particle_count;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, particles_xpos_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_xpos_array, gl.STATIC_DRAW);
        gl.vertexAttribPointer(particleProgram.x_attrib, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, particles_ypos_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_ypos_array, gl.STATIC_DRAW);
        gl.vertexAttribPointer(particleProgram.y_attrib, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, particles_time_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles_time_array, gl.STATIC_DRAW);
        gl.vertexAttribPointer(particleProgram.t_attrib, 1, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.POINTS, 0, particle_count);

    }
    
    return { "tiles" : redrawTiles, "fire" : redrawFire };
}

// </script>
// <script type="text/javascript">

// borrowed from Modest Maps, inspired by LeafletJS
var transformProperty = (function(props) {
    var style = document.documentElement.style;
    for (var i = 0; i < props.length; i++) {
        if (props[i] in style) {
            return props[i];
        }
    }
    return false;
})(['transform', '-webkit-transform', '-o-transform', '-moz-transform', '-ms-transform']);

var matrixString = (function() {
    if (('WebKitCSSMatrix' in window) && ('m11' in new WebKitCSSMatrix())) {
        return function(scale,x,y,cx,cy) {
            scale = scale || 1;
            return 'translate3d(' + [ x, y, '0px' ].join('px,') + ') scale3d(' + [ scale,scale,1 ].join(',') + ')';
/*                        return 'matrix3d(' +
                [ scale, '0,0,0,0',
                  scale, '0,0,0,0,1,0',
                  (x + ((cx * scale) - cx)).toFixed(4),
                  (y + ((cy * scale) - cy)).toFixed(4),
                  '0,1'].join(',') + ')'; */
        }
    } else {
        return function(scale,x,y,cx,cy) {
            var unit = (transformProperty == 'MozTransform') ? 'px' : '';
            return 'matrix(' +
                [(scale || '1'), 0, 0,
                (scale || '1'),
                (x + ((cx * scale) - cx)) + unit,
                (y + ((cy * scale) - cy)) + unit
                ].join(',') + ')';
        }
    }
})();

// make a tile provider that knows how to wrap tiles around the world
function provider(tile) {
    var c = {r: tile.r, c: tile.c, z: tile.z};
    var minCol = 0, 
        maxCol = Math.pow(2,tile.z);                        
    while (c.c < minCol) c.c += maxCol;
    while (c.c >= maxCol) c.c -= maxCol;
    var z = c.z, x = c.c, y = c.r;
    return 'http://otile1.mqcdn.com/tiles/1.0.0/osm/'+z+'/'+x+'/'+y+'.jpg';
}

/**
* Collection of static functions for operating on coordinates.
*
* Coordinates are simple objects with three properties:
* "r" (row), "c" (column), and "z" (zoom).
*/
var Coordinates = {

   /**
    * Return a new coordinate, zoomed by the given amount.
    */
    zoomedBy: function(c, dz)
    {
        var power = Math.pow(2, dz);
        return {c: c.c * power, r: c.r * power, z: c.z + dz};
    },
    
   /**
    * Return a new coordinate, offset by the given coordinate.
    */
    offsetBy: function(c, o)
    {
        return {c: c.c + o.c, r: c.r + o.r, z: c.z + o.z};
    },
    
   /**
    * Return a new round-number coordinate containing the given coordinate.
    */
    container: function(c)
    {
        c = Coordinates.zoomedBy(c, Math.round(c.z) - c.z);
        return {c: Math.floor(c.c), r: Math.floor(c.r), z: c.z};
    }

};

var modestParent, modestMap;

function Grid(parent, gridWidth, gridHeight)
{
    zoom = 2;
    column = 328;
    row = 791.5;
    modestParent = d3.select(parent).append("div")[0][0];
    modestMap = new MM.Map(modestParent, new MM.TemplatedLayer("http://tile.stamen.com/toner/{Z}/{X}/{Y}.png"));
    // modestMap.setCenterZoom(new MM.Location(40.4549295, -119.4194155), 2.5);
    modestParent.id = "parentDiv";

    modestMap.setSize(new MM.Point(gridWidth, gridHeight));

    function coordinateLocation(c) {
        return modestMap.coordinateLocation(new MM.Coordinate(c.r, c.c, c.z));
    }
    function locationCoordinate(center, zoom) {
        var c = modestMap.locationCoordinate(center).zoomTo(zoom);
        return {
            c: c.column,
            r: c.row,
            z: c.zoom
        };
    }
    // for debouncing the location.hash update
    var hashTimeout;

    var coord;
    if (location.hash) {
        // read the zoom, lat & lon from location.hash
        var pos = location.hash.slice(1).split("/"),
            zoom = parseFloat(pos.shift()),
            center = new MM.Location(parseFloat(pos[0]), parseFloat(pos[1]));
        coord = locationCoordinate(center, zoom);
        console.log("location.hash:", location.hash, zoom, center, "->", coord);
    } else {
        center = new MM.Location(34.874, -108.165);
        zoom = 6
        coord = locationCoordinate(center, zoom);
    }


    // col, row, zoom
    var roundCoord = null,          // coord at an integer zoom level
        tileSize = {w: 256, h: 256};// px
        
    var map = d3.select(parent),
        w = map.node().clientWidth,
        h = map.node().clientHeight,
        center = {x: w/2, y: h/2 }; // center of map in pixels
    
    d3.timer(redraw);
    
    map.on('mousedown.map', onMouseDown)
       .on('mousewheel.map', onWheel)
       .on('DOMMouseScroll.map', onWheel);
    
    d3.select(window).on('resize.map', onResize);

   /**
    * Return CSS left property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    function left(tile)
    { 
        var scale = Math.pow(2, coord.z - tile.z),
            power = Math.pow(2, tile.z - roundCoord.z),
            centerCol = roundCoord.c * power;
        return Math.round(center.x + (tile.c - centerCol) * tileSize.w * scale) + 'px'; 
    }

   /**
    * Return CSS top property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    function top(tile)
    { 
        var scale = Math.pow(2, coord.z - tile.z),
            power = Math.pow(2, tile.z - roundCoord.z),
            centerRow = roundCoord.r * power;
        return Math.round(center.y + (tile.r - centerRow) * tileSize.h * scale) + 'px'; 
    }

   /**
    * Return CSS width property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    function width(tile)
    {
        var scale = Math.pow(2, coord.z - tile.z);
        return Math.ceil(scale * tileSize.w)+'px'; 
    }

   /**
    * Return CSS height property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    function height(tile)
    { 
        var scale = Math.pow(2, coord.z - tile.z);
        return Math.ceil(scale * tileSize.h)+'px'; 
    }          
    
   /**
    * Return CSS transform property value for a tile.
    *
    * For 3D webkit mode
    */
    function transform(tile)
    {
        var scale = Math.pow(2, coord.z - tile.z);
        // adjust to nearest whole pixel scale (thx @tmcw)
        if (scale * tileSize.w % 1) {
            scale += (1 - scale * tileSize.w % 1) / tileSize.w;
        }                
        var zoomedCoord = Coordinates.zoomedBy(roundCoord, tile.z - roundCoord.z),
            x = Math.round(center.x + (tile.c - zoomedCoord.c) * tileSize.w * scale),
            y = Math.round(center.y + (tile.r - zoomedCoord.r) * tileSize.h * scale);
        return matrixString(scale, x, y, tileSize.w/2.0, tileSize.h/2.0);
    }
    
    // don't show above/below the poles
    function validCoordinateFilter(tile)
    {
        var minRow = 0, 
            maxRow = Math.pow(2, tile.z);                    

        return minRow <= tile.r && tile.r < maxRow;                
    }
    
    var visibleCoords = [];
    var status = {coords: visibleCoords, dirty: false, entering: [], exiting: []};
    status.coord = function(c) {
        if (arguments.length) {
            coord = c;
            redraw();
        } else {
            return coord;
        }
    }

    function redraw()
    {
        status.dirty = true;
    
        // apply coord limits
        if (coord.z > 18) {
            coord = Coordinates.zoomedBy(coord, 18-coord.z);
        } else if (coord.z < 0) {
            coord = Coordinates.zoomedBy(coord, -coord.z);
        }
        
        // find coordinate extents of map
        var tl = Coordinates.offsetBy(coord, {c: -center.x / tileSize.w, r: -center.y / tileSize.h, z: 0}),
            br = Coordinates.offsetBy(coord, {c: center.x / tileSize.w, r: center.y / tileSize.h, z: 0});

        // round coords to "best" zoom level
        roundCoord = Coordinates.zoomedBy(coord, Math.round(coord.z)-coord.z);
        tl = Coordinates.zoomedBy(tl, Math.round(tl.z)-tl.z);
        br = Coordinates.zoomedBy(br, Math.round(br.z)-br.z);

        // generate visible tile coords           
        var padding = 0;
        var cols = d3.range( Math.floor(tl.c) - padding, Math.ceil(br.c) + padding),
            rows = d3.range( Math.floor(tl.r) - padding, Math.ceil(br.r) + padding);
        
        visibleCoords.splice(0, visibleCoords.length);
        
        rows.forEach(function(row) {
            cols.forEach(function(col) {
                var coord = {c: col, r: row, z: roundCoord.z};
                
                if(validCoordinateFilter(coord))
                {
                    // attach an (x, y) for use outside Grid()
                    coord.x = parseInt(left(coord));
                    coord.y = parseInt(top(coord));
                    coord.w = parseInt(width(coord));
                    coord.h = parseInt(height(coord));

                    visibleCoords.push(coord);
                }
            });
        });
        
        // explicitly preserve parent tiles for tiles we haven't already loaded
        // not strictly necessary but helps with continuity on slow connections
        var compensationCoords = [];
            uniqueCompensations = {};

        function addParentIfNeeded(tile)
        {
            if (tile.z > 0 && tile.z > coord.z - 18) {
                tile = Coordinates.container(Coordinates.zoomedBy(tile, -1));
                src = provider(tile);
                if (!(src in uniqueCompensations))
                {
                    uniqueCompensations[src] = true;
                    compensationCoords.push(tile);
                }
                // better continuity if we loop, but slower (needs tuning)
                addParentIfNeeded(tile);
            }
        }

        visibleCoords.forEach(addParentIfNeeded);
        
        for(var i = 0; i < compensationCoords.length; i++)
        {
            visibleCoords.push(compensationCoords[i]);
        }

        // Takes the place of just String on coordinates below
        function coordString(c) { return [c.c, c.r, c.z].toString() };
        
        var tiles = map.selectAll('div.tile')
           .data(visibleCoords, coordString);

        status.entering.splice(0, status.entering.length);
        status.exiting.splice(0, status.exiting.length);
        
        // setup new things                        
        tiles.enter().append('div')
            .attr("id", coordString)
            .attr("class", "tile")
            //.text(coordString)
            .each(function(tile) { status.entering.push(tile) });

        // TODO: on('error')?

        // clean up old things
        tiles.exit().remove()
            .each(function(tile) { status.exiting.push(tile) });
        
        // update all positions, enter/update/exit alike
        if (transformProperty) {
            map.selectAll('div.tile')
                .style(transformProperty, transform);                        
        } else {
            map.selectAll('div.tile')
                .style("left", left)
                .style("top", top)
                .style("width", width)
                .style("height", height);
        }

        // update the hash
        clearTimeout(hashTimeout);
        hashTimeout = setTimeout(function() {
            var loc = coordinateLocation(coord),
                precision = Math.max(0, Math.ceil(Math.log(coord.z) / Math.LN2));
            location.hash = "#" + [
                coord.z,
                loc.lat.toFixed(precision),
                loc.lon.toFixed(precision)
            ].join("/");
        }, 50);

        return true;
    }
    
    function mousePosition()
    {
        var div = map.node();
        return {x: d3.mouse(div)[0], y: d3.mouse(div)[1]}
    }
    
    function onMouseDown()
    {
        var prevMouse = mousePosition();

        d3.select(window)
            .on('mousemove.map', onMouseMove)
            .on('mouseup.map', onMouseUp)
        d3.event.preventDefault();
        d3.event.stopPropagation();                        
        
        function onMouseMove()
        {
            var mouse = prevMouse;
            prevMouse = mousePosition();
            coord = Coordinates.offsetBy(coord, {
                c: -((prevMouse.x - mouse.x) / tileSize.w),
                r: -((prevMouse.y - mouse.y) / tileSize.h),
                z: 0
            });
            d3.event.preventDefault();
            d3.event.stopPropagation();
            d3.timer(redraw);
        }
        
        function onMouseUp()
        {
            prevMouse = null;
            d3.select(window)
                .on('mousemove.map',null)
                .on('mouseup.map',null);
        }
    }
    
    function onWheel() {
        // 18 = max zoom, 0 = min zoom
        var delta = Math.min(18-coord.z,Math.max(6-coord.z,d3_behavior_zoomDelta()));
        if (delta != 0) {
            var mouse = mousePosition();
            coord = Coordinates.offsetBy(coord, {
                c: ((mouse.x-center.x) / tileSize.w),
                r: ((mouse.y-center.y) / tileSize.h),
                z: 0
            });
            coord = Coordinates.zoomedBy(coord, delta);
            coord = Coordinates.offsetBy(coord, {
                c: -((mouse.x-center.x) / tileSize.w),
                r: -((mouse.y-center.y) / tileSize.h),
                z: 0
            });
            d3.timer(redraw);
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();                        
    }
        
    function onResize()
    {
        center = {x: map.node().clientWidth/2, y: map.node().clientHeight/2}
        d3.timer(redraw);
    }
    
    function zoomTo(zoom)
    {
        var oldzoom = coord.z;
        
        coord.z = zoom;
        coord.r *= Math.pow(2, coord.z - oldzoom);
        coord.c *= Math.pow(2, coord.z - oldzoom);
        
        redraw();
    }
    
    // document.getElementById('zoom-in').onclick = function()
    // {
    //     zoomTo(Math.round(coord.z + 1));
    // };
    
    // document.getElementById('zoom-out').onclick = function()
    // {
    //     if (coord.z == 6) return;
    //     zoomTo(Math.round(coord.z - 1));
    // };

    var canvas = document.getElementById('c');

    canvas.ondblclick = function(e) {
        var pos = {x: e.offsetX, y: e.offsetY};
        // modestMap.coordinate = new MM.Coordinate(coord.r, coord.c, coord.z);
        //var coordinate = locationCoordinate(new MM.P)
        console.log(pos.x, pos.y);
        coord = Coordinates.offsetBy(coord, {
                c: ((pos.x-center.x) / tileSize.w),
                r: ((pos.y-center.y) / tileSize.h),
                z: 0
            });
        zoomTo(Math.round(coord.z + (e.shiftKey ? -1 : 1)));
    };
    
    return status;
};

var redraw, grid_stat;
function redrawAllLayers() {
    bg();
    redraw.tiles();
    redraw.fire();
}

// expose this so our own mousewheel handler can use it
var d3_behavior_zoomDiv = null;

// detect the pixels that would be scrolled by this wheel event
function d3_behavior_zoomDelta() {

  // mousewheel events are totally broken!
  // https://bugs.webkit.org/show_bug.cgi?id=40441
  // not only that, but Chrome and Safari differ in re. to acceleration!
  if (!d3_behavior_zoomDiv) {
    d3_behavior_zoomDiv = d3.select("body").append("div")
        .style("visibility", "hidden")
        .style("top", 0)
        .style("height", 0)
        .style("width", 0)
        .style("overflow-y", "scroll")
      .append("div")
        .style("height", "2000px")
      .node().parentNode;
  }

  var e = d3.event, delta;
  try {
    d3_behavior_zoomDiv.scrollTop = 250;
    d3_behavior_zoomDiv.dispatchEvent(e);
    delta = 250 - d3_behavior_zoomDiv.scrollTop;
  } catch (error) {
    delta = e.wheelDelta || (-e.detail * 5);
  }

  return delta * .005;
}
