import { MEADOW_LIGHT_GLSL } from '@views/ride/config/meadowGlsl';
import { SUN } from '@views/ride/config/scene';
import { GRASS_LOD, GUST } from '@views/ride/model/grass/constants';

const SUN_LENGTH = Math.hypot(...SUN.position);
const SUN_DIRECTION_GLSL = `vec3(${SUN.position.map((component) => (component / SUN_LENGTH).toFixed(5)).join(',')})`;
const RUNNER_PUSH = { radius: 2.4, bend: 0.85 } as const;

export const GRASS_VERTEX_SHADER = `
  attribute float aLodIndex;
  attribute float aDetail;
  uniform float uTime;
  uniform vec2 uRunnerXZ;
  uniform float uRunnerAir;
  uniform vec2 uGustOrigin;
  uniform float uGustAge;
  varying float vFrc;
  varying float vDist;
  varying float vTint;
  varying vec2 vWorldXZ;
  varying float vBacklight;
  void main() {
    // 연속 LOD: blade 밑동의 카메라 XZ 거리로 살릴지·얼마나 키울지 정한다. 인덱스 비율(aLodIndex)이 keep 아래면 보이고,
    // 임계 근처는 크기를 줄여 다가갈수록 자라난다. 죽은 blade는 크기 0.
    vec2 basePos = instanceMatrix[3].xz;
    float camDist = distance(basePos, cameraPosition.xz);
    float keep = exp(-max(camDist - ${GRASS_LOD.nearFull.toFixed(1)}, 0.0) / ${GRASS_LOD.falloff.toFixed(1)});
    float alive = 1.0 - smoothstep(keep * ${GRASS_LOD.growBand.toFixed(2)}, keep, aLodIndex);
    float lodScale = mix(1.0, ${GRASS_LOD.farScale.toFixed(2)}, smoothstep(${GRASS_LOD.scaleNear.toFixed(1)}, ${GRASS_LOD.scaleFar.toFixed(1)}, camDist));
    float detailScale = 1.0 - aDetail * smoothstep(24.0, 36.0, camDist);
    vec4 world = instanceMatrix * vec4(position * lodScale * alive * detailScale, 1.0);
    vWorldXZ = world.xz;
    vBacklight = pow(max(dot(normalize(world.xyz - cameraPosition), ${SUN_DIRECTION_GLSL}), 0.0), 4.0);
    float hash = fract(sin(dot(floor(world.xz), vec2(12.9898, 78.233))) * 43758.5453);
    vTint = 0.88 + hash * 0.24;

    float dispPower = uv.y * uv.y;
    float gust = sin(uTime * 0.55 + basePos.x * 0.06 + basePos.y * 0.04) * 0.5 + 0.5;
    float wave = sin(uTime * 1.4 + basePos.x * 0.22 + basePos.y * 0.14);
    float flutter = sin(uTime * 3.0 + hash * 6.28 + uv.y * 3.0) * 0.025;
    float disp = (wave * (0.08 + gust * 0.14) + flutter) * dispPower;
    world.x += disp;
    world.z += disp * 0.55;
    world.y -= abs(disp) * 0.2;

    vec2 away = world.xz - uRunnerXZ;
    float awayDist = max(length(away), 0.001);
    float grounded = 1.0 - smoothstep(0.5, 3.0, uRunnerAir);
    float push = (1.0 - smoothstep(0.4, ${RUNNER_PUSH.radius.toFixed(2)}, awayDist)) * dispPower * ${RUNNER_PUSH.bend.toFixed(2)} * grounded;
    world.xz += (away / awayDist) * push;

    vec2 fromGust = world.xz - uGustOrigin;
    float gustDist = max(length(fromGust), 0.001);
    float ringRadius = uGustAge * ${GUST.speed.toFixed(2)};
    float ring = exp(-pow((gustDist - ringRadius) / ${GUST.width.toFixed(2)}, 2.0))
               * step(0.0, uGustAge) * (1.0 - smoothstep(0.0, ${GUST.duration.toFixed(2)}, uGustAge));
    world.xz += (fromGust / gustDist) * ring * dispPower * ${GUST.bend.toFixed(2)};

    vFrc = uv.y;
    // 씬 fog와 같은 뷰 공간 깊이. XZ 거리로 하면 위에서 내려다볼 때 지면 fog와 어긋난다.
    vDist = -(viewMatrix * world).z;
    gl_Position = projectionMatrix * modelViewMatrix * world;
  }
`;

export const GRASS_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uBrightness;
  uniform vec3 uHorizonColor;
  uniform vec3 uGroundColor;
  uniform vec3 uGrassBase;
  uniform vec3 uGrassTip;
  uniform vec3 uGrassDry;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying float vFrc;
  varying float vDist;
  varying float vTint;
  varying vec2 vWorldXZ;
  varying float vBacklight;
  ${MEADOW_LIGHT_GLSL}
  void main() {
    // SCENE_COLORS의 밑동·끝 색을 Three Color가 선형 공간으로 변환해 전달한다.
    float dry = smoothstep(0.7, 0.95, sin(vWorldXZ.x * 0.11 + vWorldXZ.y * 0.07) * 0.5 + 0.5);
    vec3 tip = mix(uGrassTip, uGrassDry, dry * 0.28);
    vec3 col = mix(uGrassBase, tip, pow(vFrc, 0.75)) * uBrightness * vTint;

    // 광역 색 얼룩(초원의 옅고 진한 패치)
    float meadow = sin(vWorldXZ.x * 0.045) * sin(vWorldXZ.y * 0.045) * 0.5 + 0.5;
    col *= mix(0.9, 1.08, meadow);
    col *= meadowLight(vWorldXZ, uTime);
    col *= mix(vec3(1.0), vec3(1.35, 1.18, 0.82), vBacklight * pow(vFrc, 1.5) * 0.7);

    vec3 groundHere = mix(uGroundColor, uHorizonColor, smoothstep(uFogNear, uFogFar, vDist));
    float fade = smoothstep(uFadeNear, uFadeFar, vDist);
    col = mix(col, groundHere, fade);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>

  }
`;
