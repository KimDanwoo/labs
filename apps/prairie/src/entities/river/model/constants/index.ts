import { RIVER_GLSL } from '@shared/config';

// 물 표면·자갈 하상 셰이더. 잔디와 같은 방식(인라인 GLSL) — Turbopack에서 별도 로더가 필요 없다.
// 무늬는 world 좌표로 계산해 평면이 카메라를 따라가도 세계에 고정된다. 강 기하는 RIVER_GLSL을 공유한다.

// 하류(-Z)로 진행하는 파도 세 겹. 물가(수심 0)에서는 죽인다.
const RIPPLE_GLSL = `
  float ripple(vec2 xz, float t) {
    return sin(xz.y * 0.45 + t * 1.6) * 0.6
         + sin(xz.y * 0.95 - xz.x * 0.7 + t * 2.3) * 0.3
         + sin(xz.x * 1.9 + xz.y * 1.3 + t * 3.1) * 0.15;
  }
`;

// 수면 메시는 y = -waterDrop에 놓인다. 파도 높이만 로컬 +z(회전 후 world +y)로 얹고,
// 유한차분으로 기울어진 노멀을 만들어 반사에 쓴다. 강둑 위(수심 < 0)로 뻗은 부분은 불투명 하상에 가려진다.
export const RIVER_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uRippleHeight;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vWaterDepth;
  varying float vViewDepth;
  ${RIVER_GLSL}
  ${RIPPLE_GLSL}
  void main() {
    float waterDepth = riverBedDepth(abs(position.x)) - RIVER_WATER_DROP;
    float damp = clamp(waterDepth / 0.3, 0.0, 1.0) * uRippleHeight;
    vec2 xz = (modelMatrix * vec4(position, 1.0)).xz;

    float h = ripple(xz, uTime) * damp;
    const float e = 0.35;
    float hx = ripple(xz + vec2(e, 0.0), uTime) * damp;
    float hz = ripple(xz + vec2(0.0, e), uTime) * damp;
    vNormalW = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));

    vec3 displaced = position;
    displaced.z += h;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = world.xyz;
    vWaterDepth = waterDepth;
    vViewDepth = -(viewMatrix * world).z;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// 내려다보면 맑아 바닥이 비치고(수심 따라 진해짐), 스치는 각에서는 하늘 큐브맵을 비춘다(슐릭 프레넬).
// 잔잔한 인상을 위해 반사는 LOD 바이어스로 흐리게, 글린트는 넓고 약하게. 수심 0으로 갈수록 투명해져 물가 선이 생기지 않는다.
export const RIVER_FRAGMENT_SHADER = `
  uniform samplerCube uSky;
  uniform float uSkyMix;
  uniform float uSkyGamma;
  uniform float uSkyBlur;
  uniform vec3 uSunDir;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uHorizonColor;
  uniform float uBaseAlpha;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vWaterDepth;
  varying float vViewDepth;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 toCam = normalize(cameraPosition - vWorldPos);

    float depthT = clamp(vWaterDepth, 0.0, 1.0);
    vec3 col = mix(uShallowColor, uDeepColor, depthT);
    float alpha = mix(uBaseAlpha, 0.8, depthT);

    float fresnel = 0.04 + 0.56 * pow(1.0 - max(dot(n, toCam), 0.0), 5.0);
    vec3 refl = reflect(-toCam, n);
    refl.y = abs(refl.y);
    vec3 sky = pow(textureCube(uSky, refl, uSkyBlur).rgb, vec3(1.0 / uSkyGamma));
    sky = mix(uHorizonColor, sky, uSkyMix);
    col = mix(col, sky, fresnel);
    alpha = mix(alpha, 1.0, fresnel);

    float glint = pow(max(dot(refl, uSunDir), 0.0), 60.0);
    col += vec3(1.0, 0.97, 0.88) * glint * 0.22;

    alpha *= smoothstep(0.0, 0.25, vWaterDepth);

    float fade = smoothstep(uFadeNear, uFadeFar, vViewDepth);
    col = mix(col, uHorizonColor, fade);
    gl_FragColor = vec4(col, mix(alpha, 1.0, fade));
  }
`;

// 하상 메시는 y = 0(지면)에 놓이고, 프로파일만큼 아래로 변위한다 → 골 가장자리(깊이 0)가 Ground 구멍 테두리와 맞물린다.
export const RIVER_BED_VERTEX_SHADER = `
  varying vec2 vWorldXZ;
  varying float vBed;
  varying float vRiverDist;
  varying float vViewDepth;
  ${RIVER_GLSL}
  void main() {
    vRiverDist = abs(position.x);
    float bed = riverBedDepth(vRiverDist);
    vec3 displaced = position;
    displaced.z -= bed;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldXZ = world.xz;
    vBed = bed;
    vViewDepth = -(viewMatrix * world).z;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// 자갈: 3×3 보로노이 한 패스. 셀마다 지터된 중심을 두고 가장 가까운 중심까지의 거리로 돌 경계와 볼록한 음영을,
// 셀 해시로 돌마다 색을 흩는다. 깊을수록 살짝 어둡고(AO), 수면선 바로 위는 젖어 어둡고, 물속에는 옅은 커스틱.
// 골 가장자리 uBankBlend 폭에서 잔디색으로 녹아 Ground 구멍 테두리가 선으로 보이지 않는다.
export const RIVER_BED_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uPebbleDark;
  uniform vec3 uPebbleLight;
  uniform vec3 uGrassColor;
  uniform float uBankBlend;
  uniform vec3 uHorizonColor;
  uniform float uPebbleScale;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec2 vWorldXZ;
  varying float vBed;
  varying float vRiverDist;
  varying float vViewDepth;
  ${RIVER_GLSL}

  vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }

  void main() {
    vec2 p = vWorldXZ * uPebbleScale;
    vec2 base = floor(p);
    float nearest = 1e9;
    vec2 nearestCell = base;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 cell = base + vec2(float(i), float(j));
        vec2 center = cell + 0.25 + hash2(cell) * 0.5;
        float d = distance(p, center);
        if (d < nearest) {
          nearest = d;
          nearestCell = cell;
        }
      }
    }

    vec3 col = mix(uPebbleDark, uPebbleLight, hash2(nearestCell + 7.0).x);
    float dome = smoothstep(0.55, 0.05, nearest);
    col *= mix(0.86, 1.06, dome);

    float waterDepth = vBed - RIVER_WATER_DROP;
    col *= mix(1.0, 0.82, clamp(vBed / RIVER_DEPTH, 0.0, 1.0));
    float wet = 1.0 - smoothstep(0.0, 0.35, -waterDepth);
    col *= mix(1.0, 0.86, wet);

    vec2 q = vWorldXZ * 1.4;
    float c1 = sin(q.x * 2.1 + uTime * 1.3) * sin(q.y * 1.7 - uTime * 0.9);
    float c2 = sin((q.x + q.y) * 1.3 - uTime * 1.1);
    float caustic = pow(max(c1 * c2, 0.0), 2.5) * step(0.0, waterDepth);
    col += vec3(0.12, 0.13, 0.11) * caustic * (1.0 - smoothstep(0.0, 1.2, waterDepth) * 0.5);

    float bank = smoothstep(RIVER_TRENCH_HALF - uBankBlend, RIVER_TRENCH_HALF, vRiverDist);
    col = mix(col, uGrassColor, bank);

    float fade = smoothstep(uFadeNear, uFadeFar, vViewDepth);
    gl_FragColor = vec4(mix(col, uHorizonColor, fade), 1.0);
  }
`;
