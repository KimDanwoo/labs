'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { prepareRunnerModel } from '../../lib/runner/prepareRunnerModel';
import { position, rotationY, scale } from '../../lib/runner/runner';
import { updateRunnerPose, type PoseMemory } from '../../lib/runner/runnerPose';
import { useDispose } from '../../model/hooks/useDispose';
import { useRunnerDetail } from '../../model/hooks/useRunnerDetail';
import { useRunnerGaits } from '../../model/hooks/useRunnerGaits';
import { RUNNER_MODEL_URL } from '../../model/runner/constants';
import { FlowingHair } from './FlowingHair';
import { HeadCrown } from './HeadCrown';
import { Horn } from './Horn';
import { MagicWings } from './MagicWings';

interface RunnerProps {
  speedRef: { current: number };
}

export function Runner({ speedRef }: RunnerProps) {
  const root = useRef<Group>(null);
  const memory = useRef<PoseMemory>({ heading: 0, previousSpeed: 0, acceleration: 0 });
  const { scene, animations } = useGLTF(RUNNER_MODEL_URL);
  const prepared = useMemo(() => prepareRunnerModel(scene), [scene]);
  const { actions } = useAnimations(animations, root);
  const gaitRef = useRunnerGaits(actions);
  useDispose(prepared.materials);
  useRunnerDetail(prepared);

  useFrame((state, rawDelta) => {
    updateRunnerPose(
      root.current,
      gaitRef.current,
      memory.current,
      speedRef.current,
      state.clock.elapsedTime,
      rawDelta,
    );
  });

  const head = prepared.model.getObjectByName('Head');
  const tailRoot = prepared.model.getObjectByName('Tail1');
  const tailTip = prepared.model.getObjectByName('Tail7_end');
  const neck = prepared.model.getObjectByName('Neck1');
  const shoulder = prepared.model.getObjectByName('Torso3');
  return (
    <group ref={root} scale={scale} rotation={[0, rotationY, 0]} position={position}>
      <primitive object={prepared.model} />
      {shoulder && <MagicWings anchor={shoulder} />}
      {tailRoot && tailTip && <FlowingHair head={tailRoot} neck={tailTip} speedRef={speedRef} isTail />}
      {head && neck && <FlowingHair head={head} neck={neck} speedRef={speedRef} />}
      {head &&
        createPortal(
          <>
            <Horn />
            <HeadCrown />
          </>,
          head,
        )}
    </group>
  );
}

useGLTF.preload(RUNNER_MODEL_URL);
