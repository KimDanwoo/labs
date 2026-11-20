import { RIVER_GLSL, TERRAIN_GLSL } from '@views/ride/config/riverGlsl';
import { CINEMATIC } from '@views/ride/config/scene';
import { BufferGeometry, Float32BufferAttribute } from 'three';

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

const FIELD_SIZE = 80;
const HEIGHT_FLOOR = 0.4;
const SEED_OFFSET = { height: 300, z: 600, seed: 900 } as const;
const HASH = { scale: 127.1, shift: 3.7, amplitude: 43758.5453 } as const;

function moteHash(i: number): number {
  const value = Math.sin(i * HASH.scale + HASH.shift) * HASH.amplitude;
  return value - Math.floor(value);
}

export function makeMoteGeometry(count: number): BufferGeometry {
  const data = new BufferGeometry();
  const positions: number[] = [];
  const seeds: number[] = [];
  for (let i = 0; i < count; i++) {
    positions.push(
      (moteHash(i) - 0.5) * FIELD_SIZE,
      HEIGHT_FLOOR + moteHash(i + SEED_OFFSET.height) * CINEMATIC.dust.height,
      (moteHash(i + SEED_OFFSET.z) - 0.5) * FIELD_SIZE,
    );
    seeds.push(moteHash(i + SEED_OFFSET.seed));
  }
  data.setAttribute('position', new Float32BufferAttribute(positions, 3));
  data.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  return data;
}
