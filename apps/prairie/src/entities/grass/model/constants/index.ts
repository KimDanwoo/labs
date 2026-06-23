// ghibli-grass-v2(MIT, © Wilson Ko)의 실제 blade(glb, 넓고 굽은 모양) + BGrass 색/바람.
export const GRASS_MODEL_URL = '/models/grass/iGrass.glb';

// 카메라 주변 청크만 유지(chunk-follow). 멀어진 청크는 언마운트 → 메모리·초기화 절약.
export const GRASS_FIELD = {
  tile: 16,
  viewRadius: 4,
  bladesPerChunk: 2500,
  minScale: 1.9,
  maxScale: 3.3,
} as const;

// 거리 페이드(대기 원근: 멀수록 옅은 haze로 완만하게 사라짐). 청크 경계 전에 끝낸다.
export const GRASS_FADE = {
  near: 22,
  far: 48,
} as const;

// 셀 좌표 → 결정적 시드(재방문해도 같은 배치).
export function chunkSeed(cellX: number, cellZ: number): number {
  return (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663)) >>> 0;
}

// 바람: 끝(uv.y=1)일수록 더 흔들리고, 완만한 돌풍(gust)으로 세기가 출렁인다.
// blade별 위치 해시로 색·바람 위상을 흩어 군집감을 준다.
export const GRASS_VERTEX_SHADER = `
  uniform float uTime;
  varying float vFrc;
  varying float vDist;
  varying float vTint;
  varying vec2 vWorldXZ;
  void main() {
    vec4 world = instanceMatrix * vec4(position, 1.0);
    vWorldXZ = world.xz;
    float hash = fract(sin(dot(floor(world.xz), vec2(12.9898, 78.233))) * 43758.5453);
    vTint = 0.86 + hash * 0.28;

    float dispPower = (1.0 - cos(uv.y * 1.5708)) * 0.35;
    float gust = sin(uTime * 0.6 + world.x * 0.05 + world.z * 0.05) * 0.5 + 0.5;
    float windAmt = 0.12 * dispPower * (0.7 + 0.7 * gust);
    float disp = sin(world.z * 0.6 + uTime * 2.2 + hash * 6.28) * windAmt
               + cos(world.x * 0.5 + uTime * 1.6) * windAmt * 0.5;
    world.x += disp;
    world.z += disp * 0.5;

    vFrc = uv.y;
    vDist = distance(world.xz, cameraPosition.xz);
    gl_Position = projectionMatrix * modelViewMatrix * world;
  }
`;

// 밑동 진초록 → 끝 싱그러운 생초록 + blade별 색 변주, 거리에 따라 안개색으로 페이드.
export const GRASS_FRAGMENT_SHADER = `
  uniform float uBrightness;
  uniform vec3 uHorizonColor;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying float vFrc;
  varying float vDist;
  varying float vTint;
  varying vec2 vWorldXZ;
  void main() {
    vec3 baseColor = vec3(0.09, 0.36, 0.14);
    vec3 tipColor = vec3(0.42, 0.78, 0.30);
    vec3 col = mix(baseColor, tipColor, vFrc) * uBrightness * vTint;

    // 광역 색 얼룩(초원의 옅고 진한 패치)
    float meadow = sin(vWorldXZ.x * 0.045) * sin(vWorldXZ.y * 0.045) * 0.5 + 0.5;
    col *= mix(0.9, 1.08, meadow);

    float fade = smoothstep(uFadeNear, uFadeFar, vDist);
    col = mix(col, uHorizonColor, fade);
    gl_FragColor = vec4(col, 1.0);
  }
`;
