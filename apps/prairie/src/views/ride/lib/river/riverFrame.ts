import { FOG, RIVER } from '@views/ride/config/scene';
import {
  bedMaterial,
  oceanMaterial,
  RUNNER_SPLASH_FULL_SPEED,
  RUNNER_SPLASH_MIN_DEPTH,
  runnerDirUniform,
  runnerPosUniform,
  waterMaterial,
} from '@views/ride/lib/river/river';
import { coastDistanceAt, nearestRiverX, riverOffsetAt } from '@views/ride/lib/scene/terrain';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import type { Camera, Group } from 'three';

export interface RiverDetail {
  riverLength: number;
  riverSegments: number;
  oceanSize: number;
  bedWidthSegments: number;
  waterWidthSegments: number;
  seaFadeNear: number;
  seaFadeFar: number;
}

const COARSE_DETAIL: RiverDetail = {
  riverLength: 360,
  riverSegments: 90,
  oceanSize: 1200,
  bedWidthSegments: 24,
  waterWidthSegments: 8,
  seaFadeNear: 140,
  seaFadeFar: 550,
};
const FINE_DETAIL: RiverDetail = {
  riverLength: RIVER.length,
  riverSegments: 200,
  oceanSize: 2000,
  bedWidthSegments: 48,
  waterWidthSegments: 8,
  seaFadeNear: 300,
  seaFadeFar: 900,
};
const SPLASH_RATE = 9;
const SPLASH_MAX_DELTA = 0.1;
const RIVER_SNAP = 4;
const OCEAN_SNAP = 20;
const RIVER_VISIBLE_MARGIN = 60;
const OCEAN_VISIBLE_MARGIN = 30;

export function riverDetailFor(coarse: boolean): RiverDetail {
  return coarse ? COARSE_DETAIL : FINE_DETAIL;
}

export function applyRiverFog(coarse: boolean): void {
  const fog = FOG[coarse ? 'mobile' : 'desktop'];
  const detail = riverDetailFor(coarse);
  [waterMaterial, bedMaterial, oceanMaterial].forEach((material) => {
    material.uniforms.uFadeNear!.value = fog.near;
    material.uniforms.uFadeFar!.value = fog.far;
  });
  for (const material of [waterMaterial, oceanMaterial]) {
    material.uniforms.uSeaFadeNear!.value = detail.seaFadeNear;
    material.uniforms.uSeaFadeFar!.value = detail.seaFadeFar;
  }
}

function updateWaterUniforms(time: number, delta: number): void {
  waterMaterial.uniforms.uTime!.value = time;
  oceanMaterial.uniforms.uTime!.value = time;
  bedMaterial.uniforms.uTime!.value = time;
  const isInWater = runnerState.waterDepth > RUNNER_SPLASH_MIN_DEPTH && runnerState.airborneHeight <= 0;
  const targetSplash = isInWater ? Math.min(Math.abs(runnerState.speed) / RUNNER_SPLASH_FULL_SPEED, 1) : 0;
  const splash = waterMaterial.uniforms.uRunnerSplash!;
  splash.value += (targetSplash - splash.value) * (1 - Math.exp(-SPLASH_RATE * Math.min(delta, SPLASH_MAX_DELTA)));
  oceanMaterial.uniforms.uRunnerSplash!.value = splash.value;
  oceanMaterial.uniforms.uRunnerPos!.value.copy(runnerState.position);
  oceanMaterial.uniforms.uRunnerDir!.value.set(Math.sin(runnerState.heading), Math.cos(runnerState.heading));
  runnerPosUniform.copy(runnerState.position);
  runnerDirUniform.set(Math.sin(runnerState.heading), Math.cos(runnerState.heading));
}

function followCamera(group: Group, ocean: Group | null, camera: Camera, coarse: boolean): void {
  const { x, z } = camera.position;
  const fog = FOG[coarse ? 'mobile' : 'desktop'];
  group.position.x = nearestRiverX(x, z) - riverOffsetAt(z);
  group.position.z = Math.round(z / RIVER_SNAP) * RIVER_SNAP;
  group.visible = coastDistanceAt(x, z) < fog.far + RIVER_VISIBLE_MARGIN;
  if (!ocean) return;
  ocean.position.set(
    Math.round(x / OCEAN_SNAP) * OCEAN_SNAP,
    -RIVER.waterDrop,
    Math.round(z / OCEAN_SNAP) * OCEAN_SNAP,
  );
  ocean.visible = coastDistanceAt(x, z) > -riverDetailFor(coarse).oceanSize / 2 - OCEAN_VISIBLE_MARGIN;
}

export function updateRiver(
  groups: { river: Group | null; ocean: Group | null },
  camera: Camera,
  coarse: boolean,
  time: number,
  delta: number,
): void {
  updateWaterUniforms(time, delta);
  if (groups.river) followCamera(groups.river, groups.ocean, camera, coarse);
}
