export const FINITE_COLOR_SHADER = {
  name: 'FiniteColorShader',
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      bool isBroken = any(isnan(color)) || any(isinf(color));
      gl_FragColor = isBroken ? vec4(0.0, 0.0, 0.0, 1.0) : color;
    }`,
};
