'use client';

import {
  RUNNER_ANIM,
  RUNNER_ANIM_TUNING,
  RUNNER_MODEL_TRANSFORM,
  RUNNER_MODEL_URL,
  UNICORN_TINT,
} from '@entities/runner/model/constants';
import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Group, MathUtils, Mesh, MeshStandardMaterial, type AnimationAction } from 'three';
import { Horn } from './Horn';
import { MagicWings } from './MagicWings';

type RunnerProps = {
  speedRef: { current: number };
};

const { scale, rotationY, position } = RUNNER_MODEL_TRANSFORM;

// 부모가 넘긴 speedRef(m/s)로 idle↔run 가중치를 섞고, 달리기 배속을 속도에 맞춘다(리렌더 없음).
// 천마: 머티리얼 색 덮어쓰기 + Head 뼈에 뿔(createPortal) + 루트에 빛의 날개.
// 액션은 ref에 담아 ref 경유로만 변형한다(훅 반환값 직접 변형 금지 규칙 회피).
export function Runner({ speedRef }: RunnerProps) {
  const root = useRef<Group>(null);
  const idleRef = useRef<AnimationAction | null>(null);
  const runRef = useRef<AnimationAction | null>(null);
  const { scene, animations, nodes } = useGLTF(RUNNER_MODEL_URL);
  const { actions } = useAnimations(animations, root);

  // 천마 룩: 머티리얼 이름별 색 덮어쓰기(한 번).
  useEffect(() => {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        const tint = material instanceof MeshStandardMaterial ? UNICORN_TINT[material.name] : undefined;
        if (tint) material.color.set(tint);
      });
    });
  }, [scene]);

  useEffect(() => {
    idleRef.current = actions[RUNNER_ANIM.idle] ?? null;
    runRef.current = actions[RUNNER_ANIM.run] ?? null;
    const idle = idleRef.current;
    const run = runRef.current;
    idle?.reset().play();
    run?.reset().play();
    if (idle) idle.weight = 1;
    if (run) run.weight = 0;
  }, [actions]);

  useFrame(() => {
    const idle = idleRef.current;
    const run = runRef.current;
    if (!idle || !run) return;

    const speed = Math.abs(speedRef.current);
    const moving = speed > RUNNER_ANIM_TUNING.moveThreshold;
    // 공중에서도 달리기 애니메이션을 유지한다(멈춘 자세는 어색하다).
    run.weight = MathUtils.lerp(run.weight, moving ? 1 : 0, RUNNER_ANIM_TUNING.fadeLerp);
    idle.weight = 1 - run.weight;
    run.timeScale = MathUtils.clamp(
      speed / RUNNER_ANIM_TUNING.runRefSpeed,
      RUNNER_ANIM_TUNING.minRunScale,
      RUNNER_ANIM_TUNING.maxRunScale,
    );
  });

  const head = nodes.Head;
  return (
    <group ref={root} scale={scale} rotation={[0, rotationY, 0]} position={position}>
      <primitive object={scene} />
      <MagicWings />
      {head && createPortal(<Horn />, head)}
    </group>
  );
}

useGLTF.preload(RUNNER_MODEL_URL);
