import { Color, ShaderMaterial, Vector2, Vector3 } from 'three';
import { FOG, RIVER_TRENCH_HALF_WIDTH, SCENE_COLORS, SUN } from '../../config/scene';
import {
  RIVER_BED_FRAGMENT_SHADER,
  RIVER_BED_VERTEX_SHADER,
  RIVER_FRAGMENT_SHADER,
  RIVER_VERTEX_SHADER,
} from '../../model/river/constants';

export const TRENCH_WIDTH = (RIVER_TRENCH_HALF_WIDTH + 0.2) * 2;

// 자갈 한 알이 대략 20cm — world 좌표에 곱하는 셀 밀도.
const PEBBLE_SCALE = 5.2;

// 골 가장자리에서 자갈이 잔디색으로 녹는 폭(m).
const BANK_BLEND = 4;

// 수면 반응(뱃머리 파도·항적) 조건: 이 수심 이상, 이 속도에서 최대.
export const RUNNER_SPLASH_MIN_DEPTH = 0.05;

export const RUNNER_SPLASH_FULL_SPEED = 10;

const horizonColor = new Color(SCENE_COLORS.fog);

export const runnerPosUniform = new Vector3();

export const runnerDirUniform = new Vector2(0, 1);

// 강은 씬에 한 개뿐이라 머티리얼도 모듈 싱글턴으로 둔다.
export const waterMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uOcean: { value: 0 },
    uRunnerPos: { value: runnerPosUniform },
    uRunnerDir: { value: runnerDirUniform },
    uRunnerSplash: { value: 0 },
    uSkyTop: { value: new Color(SCENE_COLORS.skyTop) },
    uSkyHorizon: { value: new Color(SCENE_COLORS.skyBottom) },
    uSunDir: { value: new Vector3(...SUN.position).normalize() },
    uSeaDeepColor: { value: new Color('#245d70') },
    uSeaShallowColor: { value: new Color('#7cb4a4') },
    uSeaHorizonColor: { value: new Color(SCENE_COLORS.oceanHorizon) },
    uSeaFadeNear: { value: 300 },
    uSeaFadeFar: { value: 900 },
    uDeepColor: { value: new Color(SCENE_COLORS.waterDeep) },
    uShallowColor: { value: new Color(SCENE_COLORS.waterShallow) },
    uHorizonColor: { value: horizonColor.clone() },
    uFadeNear: { value: FOG.desktop.near },
    uFadeFar: { value: FOG.desktop.far },
  },
  vertexShader: RIVER_VERTEX_SHADER,
  fragmentShader: RIVER_FRAGMENT_SHADER,
  transparent: true,
  // 불투명 하상 위에 겹치는 한 장이라 깊이 기록은 끈다(투명 정렬 아티팩트 방지).
  depthWrite: false,
});

export const bedMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPebbleDark: { value: new Color(SCENE_COLORS.pebbleDark) },
    uPebbleLight: { value: new Color(SCENE_COLORS.pebbleLight) },
    uGrassColor: { value: new Color(SCENE_COLORS.grass) },
    uBankBlend: { value: BANK_BLEND },
    uHorizonColor: { value: horizonColor.clone() },
    uPebbleScale: { value: PEBBLE_SCALE },
    uFadeNear: { value: FOG.desktop.near },
    uFadeFar: { value: FOG.desktop.far },
  },
  vertexShader: RIVER_BED_VERTEX_SHADER,
  fragmentShader: RIVER_BED_FRAGMENT_SHADER,
});

// Z축으로 무한한 강. 메시는 Z로 카메라를 따라가고 X는 가장 가까운 강 중심에 스냅한다 → 한 장으로 무한 반복.
// 스냅이 바뀌는 지점(강 사이 중간)은 두 강 모두 안개 밖이라 전환이 보이지 않는다.
// 바다는 수평 평면 두 삼각형에 세계 좌표 물결을 그려 넓이와 무관하게 지오메트리 비용을 유지한다.
export const oceanMaterial = waterMaterial.clone();
