      precision mediump float;
      uniform sampler2D sampler0;
      uniform sampler2D sampler1;
      uniform sampler2D sampler2;
      uniform sampler2D sampler3;
      varying vec2 vertex_coord;
      varying vec3 texture_coord;
      void main() {
        float r = texture_coord[0];
        float s = texture_coord[1];
        float t = texture_coord[2];
        if(r == 0.0) {
          gl_FragColor = vec4(1,1,1,1.15) - texture2D(sampler0, vec2(s, t));
        } else if(r == 1.0) {
          gl_FragColor = vec4(1,1,1,1.15) - texture2D(sampler1, vec2(s, t));
        } else if (r == 2.0) {
          gl_FragColor = vec4(1,1,1,1.15) - texture2D(sampler2, vec2(s, t));
        } else {
          gl_FragColor = vec4(1,1,1,1.15) - texture2D(sampler3, vec2(s, t));
        }
      }
