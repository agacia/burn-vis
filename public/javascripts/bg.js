function backgroundGL(tiles, entering, exiting)
{
    //
    // texture size, grid rows/columns, and overall grid count
    //
    var txsz = 2048,
        txgd = Math.floor(txsz / (256 + 2)),
        txct = txgd * txgd;

    var c = document.getElementById('c')
        gl = c.getContext('experimental-webgl');
    
    // create the WebGL program, store it in "program"

    // create the WebGL program, store it in "program"
    
    var vsource = document.getElementById('shader-vs').innerText,
        fsource = document.getElementById('shader-fs').innerText,
        program = linkProgram(gl, vsource, fsource);
    
    gl.useProgram(program);

    var vertex_pos_attrib = gl.getAttribLocation(program, 'pos'),
        vertex_tex_attrib = gl.getAttribLocation(program, 'tex');

    gl.enableVertexAttribArray(vertex_pos_attrib);
    gl.enableVertexAttribArray(vertex_tex_attrib);
    
    // set up four textures
    
    for(var i = 0; i <= 3; i++)
    {
        gl.activeTexture(gl['TEXTURE'+i]);
        gl.uniform1i(gl.getUniformLocation(program, 'sampler'+i), i);

        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, txsz, txsz, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    
    var texture_targets = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3],
        texture_slots = new Array(3 * 8 * 8),
        tile_textures = {};
    
    // set up array buffer thingies
    
    var tiles_vertex_buffer = gl.createBuffer(),
        tiles_texture_buffer = gl.createBuffer(),
        tiles_index_buffer = gl.createBuffer(),
        tiles_vertex_array = new Float32Array(256 * 8),
        tiles_texture_array = new Float32Array(256 * 12),
        tiles_index_array = new Uint16Array(256 * 6);

    // populate triangle indexes
    
    var node_index_list = [0, 1, 2, 0, 2, 3];
    
    for(var i = 0; i < tiles_index_array.length; i++)
    {
        // base advances the indexes forward to the next square tile
        var base = 4 * Math.floor(i / 6),
            off = i % 6;
        
        tiles_index_array[i] = base + node_index_list[off];
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tiles_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, tiles_vertex_array, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tiles_texture_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, tiles_texture_array, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tiles_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tiles_index_array, gl.STATIC_DRAW);

    // set up a view matrix
    
    var view = gl.getUniformLocation(program, 'view');
        mat4 = new Float32Array([2.0/c.width, 0, 0, 0, 0, -2.0/c.height, 0, 0, 0, 0, 1, 0, -1, 1, 0, 1]);
    
    gl.uniformMatrix4fv(view, false, mat4);
    
    
    var queue = ImageQueue(),
        blank = new Image();
        
    blank.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAANQTFRFZmZmfFaCBAAAAB9JREFUGBntwQENAAAAwqD3T20ON6AAAAAAAAAAAL4NIQAAAQWThvcAAAAASUVORK5CYII=';
    // blank.src = 'images/blank.png';

    setInterval(function() { queue.process() }, 250);
    
    function tileKey(tile)
    {
        return [tile.z, Math.floor(tile.c), Math.floor(tile.r)].join('/');
    }
    
    function cancelTile(tile)
    {
        var src = 'http://tile.stamen.com/toner-background/'+tileKey(tile)+'.jpg';

        queue.cancel(src);
        
        // console.log('canceled', tileKey(tile));
        // console.log('queue', queue.state().join('/'), 'slots', texture_slots.filter(Boolean).length);
    }
    
    var tileindex = 0;
    
    function loadTile(tile, r, s, t)
    {
        tileindex++;
        var _tileindex = tileindex;
    
        var key = tileKey(tile),
            src = 'http://tile.stamen.com/toner-background/'+key+'.jpg';
        
        var onload = function(err, img)
        {
            // console.log('queue', queue.state().join('/'), 'slots', texture_slots.filter(Boolean).length);

            if(err != undefined)
            {
                // console.log('error in', key, (s*8 + t*64), _tileindex);
                return;
            }
        
            if(tile_textures.hasOwnProperty(key))
            {
                tile_textures[key].loaded = true;
                gl.activeTexture(texture_targets[r]);

                // Put the image down five times to buffer textures slightly
                gl.texSubImage2D(gl.TEXTURE_2D, 0, s*txsz - 1, t*txsz, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, s*txsz + 1, t*txsz, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, s*txsz, t*txsz - 1, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, s*txsz, t*txsz + 1, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, s*txsz,     t*txsz, gl.RGBA, gl.UNSIGNED_BYTE, img);
                // redraw();
                redrawAllLayers();
                
                // console.log('drawing', key, (s*8 + t*64), _tileindex);

            } else {
                // console.log('wiffed', key, (s*8 + t*64), _tileindex);
            }
        }
        
        tile_textures[key].loaded = false;
        gl.activeTexture(texture_targets[r]);
        // console.log("gl.TEXTURE_2D, 0, s*txsz, t*txsz, gl.RGBA, gl.UNSIGNED_BYTE, blank:")
        // console.log(gl.TEXTURE_2D, 0, s*txsz, t*txsz, gl.RGBA, gl.UNSIGNED_BYTE, blank)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, s*txsz, t*txsz, gl.RGBA, gl.UNSIGNED_BYTE, blank);
        queue.add(src, onload);
        
        // console.log('added', key, (s*8 + t*64), _tileindex);
    }
    
    function prioritizeZoom(zoom)
    {
        var match = '/terrain-background/' + zoom.toFixed(0) + '/';
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

    function populateTextureArray(i)
    {
        var off = i * 12,
            originalCoord = tiles[i],
            foundCoord = originalCoord;
        
        while(true)
        {
            var key = tileKey(foundCoord);
            
            if(tile_textures.hasOwnProperty(key) && tile_textures[key].loaded)
            {
                // We found a coordinate we can use!
                break;
            }
            
            if(foundCoord.z == 0)
            {
                // We ran off the end, and should just use the
                // original coordinate even if it's not loaded.
                foundCoord = originalCoord;
                key = tileKey(originalCoord);
                break;
            }
            
            // Zoom out by one step to see if a lower-zoom coordinate is available.
            foundCoord = {z: foundCoord.z-1, c: foundCoord.c/2, r: foundCoord.r/2};
        }
        
        // Now use the key and found coordinate from above to populate the array.

        if(tile_textures.hasOwnProperty(key))
        {
            var r = tile_textures[key].r, s = tile_textures[key].s, t = tile_textures[key].t;
            
            // possibly adjust the offset
            s += (foundCoord.c - Math.floor(foundCoord.c)) * 1/8;
            t += (foundCoord.r - Math.floor(foundCoord.r)) * 1/8;
            
            // possibly shrink the step
            var step = Math.pow(2, foundCoord.z - originalCoord.z) * 1/8;
            
            tiles_texture_array[off + 0] = r;
            tiles_texture_array[off + 1] = s;
            tiles_texture_array[off + 2] = t;
            tiles_texture_array[off + 3] = r;
            tiles_texture_array[off + 4] = s + step;
            tiles_texture_array[off + 5] = t;
            tiles_texture_array[off + 6] = r;
            tiles_texture_array[off + 7] = s + step;
            tiles_texture_array[off + 8] = t + step;
            tiles_texture_array[off + 9] = r;
            tiles_texture_array[off +10] = s;
            tiles_texture_array[off +11] = t + step;
        }
    }

    function redraw()
    {
        gl.useProgram(program);
        for(var i = 0; i < exiting.length; i++)
        {
            cancelTile(exiting[i]);
            var key = tileKey(exiting[i]);
        
            if(tile_textures.hasOwnProperty(key))
            {
                texture_slots[tile_textures[key].slot] = undefined;
                delete tile_textures[key];
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

                    loadTile(tile, r, s, t);
                    break;
                }
            }
        }
        
        if (tiles[0])
            prioritizeZoom(tiles[0].z);
        
        for(var i = 0; i < tiles.length; i++)
        {
            if(tiles[i].z != tiles[0].z)
            {
                break;
            }

            tiles[i].key = tileKey(tiles[i]);
            
            populateVertexArray(i);
            populateTextureArray(i);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, tiles_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, tiles_vertex_array, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertex_pos_attrib, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, tiles_texture_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, tiles_texture_array, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertex_tex_attrib, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tiles_index_buffer);
        gl.drawElements(gl.TRIANGLES, i * 6, gl.UNSIGNED_SHORT, 0);
    }
    
    return redraw;
}
