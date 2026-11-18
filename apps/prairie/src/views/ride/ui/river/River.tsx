'use client';

import { runnerState } from '../../model/ride-state/runnerState';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

import { useFrame, useThree } from '@react-three/fiber';
import { coastDistanceAt, FOG, nearestRiverX, RIVER, riverOffsetAt } from '../../config/scene';

import { useLayoutEffect, useRef } from 'react';
import { Group } from 'three';
import {
  bedMaterial,
  oceanMaterial,
  RUNNER_SPLASH_FULL_SPEED,
  RUNNER_SPLASH_MIN_DEPTH,
  runnerDirUniform,
  runnerPosUniform,
  TRENCH_WIDTH,
  waterMaterial,
} from '../../lib/river/river';
import { RiverBanks } from './RiverBanks';
oceanMaterial.uniforms.uOcean!.value = 1;

export function River() {
  const groupRef = useRef<Group>(null);
  const oceanRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const coarse = useLowDetail();

  // 안개 범위는 기기별(SceneCanvas의 scene fog와 동일 값).
  useLayoutEffect(() => {
    const fog = FOG[coarse ? 'mobile' : 'desktop'];
    [waterMaterial, bedMaterial, oceanMaterial].forEach((material) => {
      material.uniforms.uFadeNear!.value = fog.near;
      material.uniforms.uFadeFar!.value = fog.far;
    });
    for (const material of [waterMaterial, oceanMaterial]) {
      material.uniforms.uSeaFadeNear!.value = coarse ? 140 : 300;
      material.uniforms.uSeaFadeFar!.value = coarse ? 550 : 900;
    }
  }, [coarse]);

  const riverLength = coarse ? 360 : RIVER.length;
  const riverSegments = coarse ? 90 : 200;
  const oceanSize = coarse ? 1200 : 2000;

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    waterMaterial.uniforms.uTime!.value = time;
    oceanMaterial.uniforms.uTime!.value = time;
    bedMaterial.uniforms.uTime!.value = time;

    // 말이 물속에서 움직일 때만 수면이 반응한다(세기 = 속도 비례). 공중에선 물 위를 지나도 항적이 없다. 급변하지 않게 보간.
    const isInWater = runnerState.waterDepth > RUNNER_SPLASH_MIN_DEPTH && runnerState.airborneHeight <= 0;
    const targetSplash = isInWater ? Math.min(Math.abs(runnerState.speed) / RUNNER_SPLASH_FULL_SPEED, 1) : 0;
    const splash = waterMaterial.uniforms.uRunnerSplash!;
    splash.value += (targetSplash - splash.value) * (1 - Math.exp(-9 * Math.min(delta, 0.1)));
    oceanMaterial.uniforms.uRunnerSplash!.value = splash.value;
    oceanMaterial.uniforms.uRunnerPos!.value.copy(runnerState.position);
    oceanMaterial.uniforms.uRunnerDir!.value.set(Math.sin(runnerState.heading), Math.cos(runnerState.heading));
    runnerPosUniform.copy(runnerState.position);
    runnerDirUniform.set(Math.sin(runnerState.heading), Math.cos(runnerState.heading));

    const group = groupRef.current;
    if (!group) return;
    group.position.x = nearestRiverX(camera.position.x, camera.position.z) - riverOffsetAt(camera.position.z);
    group.position.z = Math.round(camera.position.z / 4) * 4;
    group.visible = coastDistanceAt(camera.position.x, camera.position.z) < FOG[coarse ? 'mobile' : 'desktop'].far + 60;
    const ocean = oceanRef.current;
    if (ocean) {
      ocean.position.set(
        Math.round(camera.position.x / 20) * 20,
        -RIVER.waterDrop,
        Math.round(camera.position.z / 20) * 20,
      );
      ocean.visible = coastDistanceAt(camera.position.x, camera.position.z) > -oceanSize / 2 - 30;
    }
  });

  return (
    <>
      <RiverBanks />
      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={bedMaterial} frustumCulled={false}>
          <planeGeometry args={[TRENCH_WIDTH, riverLength, coarse ? 24 : 48, riverSegments]} />
        </mesh>
        <mesh
          position={[0, -RIVER.waterDrop, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={waterMaterial}
          frustumCulled={false}
        >
          <planeGeometry args={[TRENCH_WIDTH, riverLength, 8, riverSegments]} />
        </mesh>
      </group>
      <group ref={oceanRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={oceanMaterial} frustumCulled={false}>
          <planeGeometry args={[oceanSize, oceanSize]} />
        </mesh>
      </group>
    </>
  );
}
