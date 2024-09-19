const shader = /* glsl */  `

uniform sampler2D uTexture; 
uniform vec2 uResolution;
uniform vec2 uGridSize;
uniform vec3 uMouse;
uniform int uFrame;


varying vec2 vUv;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float GetNeighbours(vec2 p) {
  float count = 0.0;

  for(float y = -1.0; y <= 1.0; y++) {
      for(float x = -1.0; x <= 1.0; x++) {

          if(x == 0.0 && y == 0.0)
              continue;

          // Scale the offset down
          vec2 offset = vec2(x, y) / uGridSize;	
          // Apply offset and sample texture	 
          vec4 lookup = texture2D(uTexture, p + offset); 
           // Accumulate the result
          count += lookup.r > 0.5 ? 1.0 : 0.0;
      }
  }

  return count;
}


void main() {

     vec3 color = vec3(0.0);

     float neighbors = 0.0;

    if(uFrame % 5 != 0) {
        color = texture2D(uTexture, vUv).xyz;
    } 
    else {

        neighbors += GetNeighbours(vUv);

        bool alive = texture2D(uTexture, vUv).x > 0.5;

        if(alive && (neighbors == 2.0 || neighbors == 3.0)) { //cell is alive
            float colVal = remap(neighbors, 0.0, 3.0, 0.5, 1.0);

      		//Any live cell with two or three live neighbours lives on to the next generation.
            color = vec3(1.0, 0.5, 1.0);

        } else if(!alive && (neighbors == 3.0)) { 
        //Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
            color = vec3(1.0, 0.0, 0.0);

        }
    }

    vec2 mouse = uMouse.xy / uResolution.xy;

    if(uMouse.z > 0.5 && length(mouse - vUv) < 0.01) {
        color = vec3(1.0);
    }

    gl_FragColor = vec4(color, 1.0);
}

`
export default shader;
