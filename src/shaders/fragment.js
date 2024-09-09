const shader = /* glsl */  `

  uniform sampler2D previouState;
  uniform vec2 resolution;

  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(.72, .88, .65, 1.0);
  }
`
export default shader;