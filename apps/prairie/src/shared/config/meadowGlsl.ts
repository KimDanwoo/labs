export const MEADOW_LIGHT_GLSL = `
  float meadowLight(vec2 p, float time) {
    vec2 drift = p * 0.018 + vec2(time * 0.012, time * 0.006);
    float cloud = sin(drift.x + sin(drift.y * 0.7)) * sin(drift.y * 1.3 + sin(drift.x * 0.6));
    return mix(0.76, 1.06, smoothstep(-0.45, 0.65, cloud));
  }
`;
