import { RIVER_GLSL, TERRAIN_GLSL } from '../../config/riverGlsl';
import { CINEMATIC } from '../../config/scene';

export const VERTEX = `
  attribute float aSeed;
  uniform float uTime, uDpr;
  uniform vec2 uCenter;
  varying float vAlpha;
  ${RIVER_GLSL}
  ${TERRAIN_GLSL}
  void main() {
    float span = ${(CINEMATIC.dust.radius * 2).toFixed(1)};
    vec3 p = position;
    p.xz = mod(p.xz + vec2(uTime * 0.18, uTime * 0.08) - uCenter + span * 0.5, span) - span * 0.5 + uCenter;
    p.y += terrainHeight(p.xz) + sin(uTime * 0.35 + aSeed * 20.0) * 0.4;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    float distanceFade = (1.0 - smoothstep(22.0, 40.0, length(p.xz - uCenter))) * smoothstep(1.0, 5.0, -view.z);
    vAlpha = distanceFade * (0.2 + 0.5 * pow(sin(uTime * 0.5 + aSeed * 30.0) * 0.5 + 0.5, 3.0));
    gl_PointSize = clamp((2.0 + aSeed * 2.0) * uDpr * 12.0 / max(-view.z, 1.0), 1.0, 5.0 * uDpr);
    gl_Position = projectionMatrix * view;
  }
`;

export const FRAGMENT = `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.1, 1.0, radius)) * vAlpha;
    gl_FragColor = vec4(uColor * 1.4, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
