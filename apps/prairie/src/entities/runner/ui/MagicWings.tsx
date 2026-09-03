'use client';

import { WINGS } from '@entities/runner/model/constants';
import { useFrame } from '@react-three/fiber';
import { runnerState } from '@shared/r3f';
import { useRef } from 'react';
import { Color, DoubleSide, Group, MathUtils, ShaderMaterial } from 'three';

// 날개 실루엣은 uv로 그린다: 앞전은 곧고, 뒷전은 뿌리에서 두껍다가 끝으로 좁아지며 깃털 톱니. 끝은 빛으로 흩어진다.
// 버텍스에서 끝을 아래로 처지게(droop) 굽히고 깃털 물결을 얹어, 어느 각도에서도 면이 보인다.
const wingMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: WINGS.foldedOpacity },
    uDroop: { value: WINGS.droop },
    uColorRoot: { value: new Color(WINGS.colorRoot) },
    uColorTip: { value: new Color(WINGS.colorTip) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uDroop;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z -= uDroop * uv.x * uv.x;
      pos.z += 0.08 * sin(uv.x * 7.0 - uTime * 5.0) * uv.x;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    uniform vec3 uColorRoot;
    uniform vec3 uColorTip;
    varying vec2 vUv;
    void main() {
      float span = vUv.x;
      float chord = vUv.y;
      float feather = 0.5 + 0.5 * sin(span * 28.0);
      float trailing = 0.12 + 0.38 * span + 0.08 * feather;
      float leading = 0.94 - 0.22 * span * span;
      float inside = smoothstep(trailing - 0.05, trailing + 0.03, chord) * smoothstep(leading + 0.04, leading - 0.04, chord);
      float tipFade = 1.0 - smoothstep(0.7, 1.0, span);
      float veins = 0.88 + 0.12 * sin(chord * 40.0 + span * 6.0);
      vec3 col = mix(uColorRoot, uColorTip, span) * veins;
      gl_FragColor = vec4(col, inside * uOpacity * (0.55 + 0.45 * tipFade));
    }
  `,
  transparent: true,
  side: DoubleSide,
  depthWrite: false,
});

type WingSide = 1 | -1;

// 펼침 정도: 공중 1, 질주 반쯤, 지상 접힘.
function openTargetFor(isAirborne: boolean): number {
  if (isAirborne) return 1;
  return runnerState.isSprinting ? 0.45 : 0;
}

// 상황별 펄럭임 속도: 상승 중 가장 빠르고, 지상에선 숨쉬듯 느리다.
function flapSpeedFor(isAirborne: boolean): number {
  if (isAirborne) return runnerState.verticalSpeed > 0.5 ? WINGS.flapSpeedRising : WINGS.flapSpeedAir;
  return runnerState.isSprinting ? WINGS.flapSpeedSprint : WINGS.flapSpeedGround;
}

// 말 루트(Runner 그룹) 안에 좌우 한 쌍. 접힘↔펼침을 보간하고 상황별 속도로 펄럭인다.
export function MagicWings() {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const openRef = useRef(0);
  const phaseRef = useRef(0);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const isAirborne = runnerState.airborneHeight > 0.05;
    openRef.current = MathUtils.lerp(openRef.current, openTargetFor(isAirborne), WINGS.openLerp);
    const open = openRef.current;
    phaseRef.current += flapSpeedFor(isAirborne) * delta;

    const flap = WINGS.openAngleBase + Math.sin(phaseRef.current) * WINGS.flapAmplitude * (0.35 + 0.65 * open);
    const angle = MathUtils.lerp(WINGS.foldedAngle, flap, open);
    const scale = MathUtils.lerp(WINGS.foldedScale, 1, open);
    wingMaterial.uniforms.uOpacity!.value = MathUtils.lerp(WINGS.foldedOpacity, 1, open);
    wingMaterial.uniforms.uTime!.value = state.clock.elapsedTime;

    const apply = (group: Group | null, side: WingSide) => {
      if (!group) return;
      group.rotation.set(0, -side * WINGS.sweep * open, side * angle);
      group.scale.setScalar(scale);
    };
    apply(rightRef.current, 1);
    apply(leftRef.current, -1);
  });

  const [rootX, rootY, rootZ] = WINGS.root;
  const wing = (side: WingSide, ref: typeof leftRef) => (
    <group ref={ref} position={[side * rootX, rootY, rootZ]}>
      <mesh
        position={[(side * WINGS.span) / 2, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[side, 1, 1]}
        material={wingMaterial}
      >
        <planeGeometry args={[WINGS.span, WINGS.chord, 24, 4]} />
      </mesh>
    </group>
  );

  return (
    <>
      {wing(1, rightRef)}
      {wing(-1, leftRef)}
    </>
  );
}
