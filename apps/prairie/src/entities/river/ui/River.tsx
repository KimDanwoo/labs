'use client';

import {
  RIVER_BED_FRAGMENT_SHADER,
  RIVER_BED_VERTEX_SHADER,
  RIVER_FRAGMENT_SHADER,
  RIVER_VERTEX_SHADER,
} from '@entities/river/model/constants';
import { useFrame, useThree } from '@react-three/fiber';
import {
  coastDistanceAt,
  FOG,
  nearestRiverX,
  RIVER,
  RIVER_TRENCH_HALF_WIDTH,
  riverOffsetAt,
  SCENE_COLORS,
  SUN,
} from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { runnerState } from '@shared/r3f';
import { useLayoutEffect, useRef } from 'react';
import { Color, Group, ShaderMaterial, Vector2, Vector3 } from 'three';
import { RiverBanks } from './RiverBanks';

const TRENCH_WIDTH = (RIVER_TRENCH_HALF_WIDTH + 0.2) * 2;
// 자갈 한 알이 대략 20cm — world 좌표에 곱하는 셀 밀도.
const PEBBLE_SCALE = 5.2;
// 골 가장자리에서 자갈이 잔디색으로 녹는 폭(m).
const BANK_BLEND = 4;
// 수면 반응(뱃머리 파도·항적) 조건: 이 수심 이상, 이 속도에서 최대.
const RUNNER_SPLASH_MIN_DEPTH = 0.05;
const RUNNER_SPLASH_FULL_SPEED = 10;

const horizonColor = new Color(SCENE_COLORS.fog);
const runnerPosUniform = new Vector3();
const runnerDirUniform = new Vector2(0, 1);

// 강은 씬에 한 개뿐이라 머티리얼도 모듈 싱글턴으로 둔다.
const waterMaterial = new ShaderMaterial({
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

const bedMaterial = new ShaderMaterial({
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
const oceanMaterial = waterMaterial.clone();
oceanMaterial.uniforms.uOcean!.value = 1;

export function River() {
  const groupRef = useRef<Group>(null);
  const oceanRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const coarse = useIsCoarsePointer();

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
