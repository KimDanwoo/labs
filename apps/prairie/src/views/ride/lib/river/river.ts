import { FOG, RIVER_TRENCH_HALF_WIDTH, SCENE_COLORS, SUN } from '@views/ride/config/scene';
import {
  RIVER_BED_FRAGMENT_SHADER,
  RIVER_BED_VERTEX_SHADER,
  RIVER_FRAGMENT_SHADER,
  RIVER_VERTEX_SHADER,
} from '@views/ride/model/river/constants';
import { Color, ShaderMaterial, Vector2, Vector3 } from 'three';

export const TRENCH_WIDTH = (RIVER_TRENCH_HALF_WIDTH + 0.2) * 2;

const PEBBLE_SCALE = 5.2;

const BANK_BLEND = 4;

export const RUNNER_SPLASH_MIN_DEPTH = 0.05;

export const RUNNER_SPLASH_FULL_SPEED = 10;

const horizonColor = new Color(SCENE_COLORS.fog);

export const runnerPosUniform = new Vector3();

export const runnerDirUniform = new Vector2(0, 1);

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

export const oceanMaterial = waterMaterial.clone();
