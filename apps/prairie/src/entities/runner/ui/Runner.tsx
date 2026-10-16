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
import { runnerState } from '@shared/r3f';
import { useEffect, useMemo, useRef } from 'react';
import { Group, MathUtils, Mesh, MeshStandardMaterial, type AnimationAction } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Horn } from './Horn';
import { MagicWings } from './MagicWings';

type RunnerProps = { speedRef: { current: number } };
type Gaits = {
  idle: AnimationAction | null;
  walk: AnimationAction | null;
  run: AnimationAction | null;
  flight: AnimationAction | null;
};
const { scale, rotationY, position } = RUNNER_MODEL_TRANSFORM;

export function Runner({ speedRef }: RunnerProps) {
  const root = useRef<Group>(null);
  const gaitRef = useRef<Gaits>({ idle: null, walk: null, run: null, flight: null });
  const headingRef = useRef(0);
  const timeRef = useRef<{ value: number } | null>(null);
  const { scene, animations } = useGLTF(RUNNER_MODEL_URL);
  const prepared = useMemo(() => {
    const model = clone(scene);
    const time = { value: 0 };
    const materials: MeshStandardMaterial[] = [];
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const copies = source.map((material) => {
        if (!(material instanceof MeshStandardMaterial)) return material;
        const copy = material.clone();
        const tint = UNICORN_TINT[copy.name];
        if (tint) copy.color.set(tint);
        copy.metalness = 0;
        copy.roughness = copy.name === 'Eye_Black' ? 0.24 : 0.88;
        copy.envMapIntensity = 0.3;
        copy.flatShading = false;
        if (copy.name === 'Hair') {
          copy.onBeforeCompile = (shader) => {
            shader.uniforms.uManeTime = time;
            shader.vertexShader = shader.vertexShader
              .replace('#include <common>', '#include <common>\nuniform float uManeTime;')
              .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                float tail = smoothstep(0.012, 0.022, position.y);
                float tip = 1.0 - smoothstep(0.014, 0.033, position.z);
                transformed.x += sin(uManeTime * 2.8 + position.y * 180.0) * 0.0012 * tail * tip;`,
              );
          };
        }
        materials.push(copy);
        return copy;
      });
      object.material = Array.isArray(object.material) ? copies : copies[0]!;
    });
    return { model, materials, time };
  }, [scene]);
  const { actions } = useAnimations(animations, root);

  useEffect(() => {
    timeRef.current = prepared.time;
  }, [prepared]);

  useEffect(() => () => prepared.materials.forEach((material) => material.dispose()), [prepared]);
  useEffect(() => {
    const gaits = {
      idle: actions[RUNNER_ANIM.idle] ?? null,
      walk: actions[RUNNER_ANIM.walk] ?? null,
      run: actions[RUNNER_ANIM.run] ?? null,
      flight: actions[RUNNER_ANIM.flight] ?? null,
    };
    gaitRef.current = gaits;
    Object.values(gaits).forEach((action) => {
      action?.reset().play();
      if (action) action.weight = 0;
    });
    if (gaits.idle) gaits.idle.weight = 1;
    if (gaits.flight) {
      gaits.flight.time = gaits.flight.getClip().duration * 0.52;
      gaits.flight.paused = true;
    }
    return () => Object.values(gaits).forEach((action) => action?.stop());
  }, [actions]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { idle, walk, run, flight } = gaitRef.current;
    if (!idle || !walk || !run || !flight) return;
    const speed = Math.abs(speedRef.current);
    const tune = RUNNER_ANIM_TUNING;
    const moving = MathUtils.smoothstep(speed, 0.1, 0.9);
    const gallop = MathUtils.smoothstep(speed, tune.gallopBlendStart, tune.gallopBlendEnd);
    const airborne = MathUtils.smoothstep(runnerState.airborneHeight, 0.15, 0.8);
    const targets = [1 - moving, moving * (1 - gallop), moving * gallop];
    [idle, walk, run].forEach((action, index) => {
      action.weight = MathUtils.damp(action.weight, targets[index]! * (1 - airborne), tune.blendRate, delta);
    });
    flight.weight = MathUtils.damp(flight.weight, airborne, tune.blendRate, delta);
    walk.timeScale = (speedRef.current < 0 ? -1 : 1) * MathUtils.clamp(speed / tune.walkRefSpeed, 0.45, 1.7);
    run.timeScale = MathUtils.clamp(speed / tune.runRefSpeed, tune.minRunScale, tune.maxRunScale);
    if (timeRef.current) timeRef.current.value = state.clock.elapsedTime;
    if (root.current) {
      const turn = MathUtils.euclideanModulo(runnerState.heading - headingRef.current + Math.PI, Math.PI * 2) - Math.PI;
      const lean = MathUtils.clamp((turn / Math.max(delta, 0.001)) * speed * 0.006, -0.12, 0.12);
      root.current.rotation.z = MathUtils.damp(root.current.rotation.z, lean, 6, delta);
      root.current.rotation.x = MathUtils.damp(
        root.current.rotation.x,
        -runnerState.verticalSpeed * 0.018 * airborne,
        5,
        delta,
      );
    }
    headingRef.current = runnerState.heading;
  });

  const head = prepared.model.getObjectByName('Head');
  const shoulder = prepared.model.getObjectByName('Torso3');
  return (
    <group ref={root} scale={scale} rotation={[0, rotationY, 0]} position={position}>
      <primitive object={prepared.model} />
      {shoulder && <MagicWings anchor={shoulder} />}
      {head && createPortal(<Horn />, head)}
    </group>
  );
}

useGLTF.preload(RUNNER_MODEL_URL);
