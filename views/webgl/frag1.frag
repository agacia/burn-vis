      uniform mat4 view;
      attribute vec2 pos;
      attribute vec3 tex;
      varying vec2 vertex_coord;
      varying vec3 texture_coord;
      void main() {
        // vec4 fills in the remaining z, w dimensions here
        gl_Position = view * vec4(pos, 0, 1);
        vertex_coord = pos;
        texture_coord = tex;
      }
  