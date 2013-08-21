      precision mediump float;
      varying float time;
      void main() {
        gl_FragColor = vec4(1, time*.4, .1, 1);
      }
