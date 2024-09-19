const shader = /* glsl */  `

  uniform sampler2D uPreviousState;
  uniform vec2 uGridSize;

  varying vec2 vUv;

  void main() {

    vec3 value = texture2D(uPreviousState, vUv).rgb;
    

    gl_FragColor = vec4(value, 1.0);
  }
`
export default shader;