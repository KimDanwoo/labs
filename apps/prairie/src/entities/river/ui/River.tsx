'use client';

import {
  RIVER_BED_FRAGMENT_SHADER,
  RIVER_BED_VERTEX_SHADER,
  RIVER_FRAGMENT_SHADER,
  RIVER_VERTEX_SHADER,
} from '@entities/river/model/constants';
import { useFrame, useThree } from '@react-three/fiber';
import { FOG, nearestRiverX, RIVER, RIVER_TRENCH_HALF_WIDTH, SCENE_COLORS, SUN } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { runnerState } from '@shared/r3f';
import { useLayoutEffect, useRef } from 'react';
import { Color, CubeTexture, DoubleSide, Group, ShaderMaterial, Vector2, Vector3 } from 'three';

const TRENCH_WIDTH = RIVER_TRENCH_HALF_WIDTH * 2;
// 자갈 한 알이 대략 60cm — world 좌표에 곱하는 셀 밀도.
const PEBBLE_SCALE = 1.7;
// 큐브맵이 sRGB 내부 포맷으로 올라가면 샘플이 선형으로 나온다 → 다시 인코딩. 반사가 하늘보다 어둡거나 밝으면 이 값을 만진다.
const SKY_GAMMA = 2.2;
// 반사 샘플의 밉맵 LOD 바이어스. 클수록 구름이 뭉개져 잔잔한 반사가 된다.
const SKY_BLUR = 3.5;
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
    uRippleHeight: { value: RIVER.rippleHeight },
    uRunnerPos: { value: runnerPosUniform },
    uRunnerDir: { value: runnerDirUniform },
    uRunnerSplash: { value: 0 },
    uSky: { value: null },
    uSkyMix: { value: 0 },
    uSkyGamma: { value: SKY_GAMMA },
    uSkyBlur: { value: SKY_BLUR },
    uSunDir: { value: new Vector3(...SUN.position).normalize() },
    uDeepColor: { value: new Color(SCENE_COLORS.waterDeep) },
    uShallowColor: { value: new Color(SCENE_COLORS.waterShallow) },
    uHorizonColor: { value: horizonColor },
    uBaseAlpha: { value: 0.32 },
    uFadeNear: { value: FOG.desktop.near },
    uFadeFar: { value: FOG.desktop.far },
  },
  vertexShader: RIVER_VERTEX_SHADER,
  fragmentShader: RIVER_FRAGMENT_SHADER,
  side: DoubleSide,
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
    uHorizonColor: { value: horizonColor },
    uPebbleScale: { value: PEBBLE_SCALE },
    uFadeNear: { value: FOG.desktop.near },
    uFadeFar: { value: FOG.desktop.far },
  },
  vertexShader: RIVER_BED_VERTEX_SHADER,
  fragmentShader: RIVER_BED_FRAGMENT_SHADER,
});

// Z축으로 무한한 강. 메시는 Z로 카메라를 따라가고 X는 가장 가까운 강 중심에 스냅한다 → 한 장으로 무한 반복.
// 스냅이 바뀌는 지점(강 사이 중간)은 두 강 모두 안개 밖이라 전환이 보이지 않는다.
// 하늘 큐브맵은 Environment가 비동기로 scene.background에 얹으므로 프레임마다 확인해 물에 물린다.
export function River() {
  const groupRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const coarse = useIsCoarsePointer();

  // 안개 범위는 기기별(SceneCanvas의 scene fog와 동일 값).
  useLayoutEffect(() => {
    const fog = FOG[coarse ? 'mobile' : 'desktop'];
    [waterMaterial, bedMaterial].forEach((material) => {
      material.uniforms.uFadeNear!.value = fog.near;
      material.uniforms.uFadeFar!.value = fog.far;
    });
  }, [coarse]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    waterMaterial.uniforms.uTime!.value = time;
    bedMaterial.uniforms.uTime!.value = time;

    // 말이 물속에서 움직일 때만 수면이 반응한다(세기 = 속도 비례). 급변하지 않게 보간.
    const isInWater = runnerState.waterDepth > RUNNER_SPLASH_MIN_DEPTH;
    const targetSplash = isInWater ? Math.min(Math.abs(runnerState.speed) / RUNNER_SPLASH_FULL_SPEED, 1) : 0;
    const splash = waterMaterial.uniforms.uRunnerSplash!;
    splash.value += (targetSplash - splash.value) * 0.15;
    runnerPosUniform.copy(runnerState.position);
    runnerDirUniform.set(Math.sin(runnerState.heading), Math.cos(runnerState.heading));

    const sky = scene.background;
    if (sky instanceof CubeTexture && waterMaterial.uniforms.uSky!.value !== sky) {
      waterMaterial.uniforms.uSky!.value = sky;
      waterMaterial.uniforms.uSkyMix!.value = 1;
    }

    const group = groupRef.current;
    if (!group) return;
    group.position.x = nearestRiverX(camera.position.x);
    group.position.z = camera.position.z;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={bedMaterial}>
        <planeGeometry args={[TRENCH_WIDTH, RIVER.length, 48, 64]} />
      </mesh>
      <mesh position={[0, -RIVER.waterDrop, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMaterial}>
        <planeGeometry args={[TRENCH_WIDTH, RIVER.length, 24, 160]} />
      </mesh>
    </group>
  );
}
