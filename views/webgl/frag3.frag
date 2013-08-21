      uniform mat4 view;
      attribute float x;
      attribute float y;
      attribute float t;
      varying float time;
      void main() {
        if(t > 0.0) {
          gl_Position = view * vec4(x, y, 0, 1);
          gl_PointSize = ((t < .5) ? (t+.5) : (1.8-t))*5.0;
          time = t;
        }
      }
 