const shader = /* glsl */  `

  uniform sampler2D uPreviouState;
  uniform vec2 uResolution;

  varying vec2 vUv;

  int getState(vec2 uv) {
    return int(texture2D(uPreviouState, uv).r);
  }

  void main() {
    vec2 texel = 1.0 / uResolution;

    int sum = 
      getState(vUv + texel * vec2(-1.0, -1.0)) +
      getState(vUv + texel * vec2(-1.0,  0.0)) +
      getState(vUv + texel * vec2(-1.0,  1.0)) +
      getState(vUv + texel * vec2( 0.0, -1.0)) +
      getState(vUv + texel * vec2( 0.0,  1.0)) +
      getState(vUv + texel * vec2( 1.0, -1.0)) +
      getState(vUv + texel * vec2( 1.0,  0.0)) +
      getState(vUv + texel * vec2( 1.0,  1.0));

      int current = getState(vUv);


    gl_FragColor = vec4(.72, .88, .65, 1.0);

    if (current == 1 && (sum == 2 || sum == 3)) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else if (current == 0 && sum == 3) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`
export default shader;