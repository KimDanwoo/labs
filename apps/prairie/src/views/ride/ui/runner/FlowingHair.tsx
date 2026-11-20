'use client';

import { useFrame } from '@react-three/fiber';
import { FLOWING_HAIR } from '@views/ride/config/flowingHair';
import {
  injectHairShader,
  makeHairGeometry,
  makeUniforms,
  updateHairUniforms,
} from '@views/ride/lib/runner/flowingHair';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { RUNNER_FINISH } from '@views/ride/model/runner/constants';
import { useMemo, useRef } from 'react';
import { Mesh, type Object3D } from 'three';

interface FlowingHairProps {
  head: Object3D;
  neck: Object3D;
  speedRef: { current: number };
  isTail?: boolean;
}

export function FlowingHair({ head, neck, speedRef, isTail = false }: FlowingHairProps) {
  const strandCount = useLowDetail() ? FLOWING_HAIR.strandsLow : RUNNER_FINISH.strands;
  const mesh = useRef<Mesh>(null);
  const uniforms = useMemo(() => makeUniforms(), []);
  const geometry = useMemo(() => makeHairGeometry(strandCount), [strandCount]);
  useDispose(geometry);
  useFrame(({ clock }) => {
    const object = mesh.current;
    if (!object?.parent) return;
    const options = { isTail, strandCount, speed: speedRef.current, elapsed: clock.elapsedTime };
    updateHairUniforms(uniforms, object.parent, { head, neck }, options);
  });
  const { material } = FLOWING_HAIR;
  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
      <meshPhysicalMaterial
        vertexColors
        roughness={material.roughness}
        metalness={material.metalness}
        sheen={material.sheen}
        sheenColor="#f7eee1"
        sheenRoughness={material.sheenRoughness}
        onBeforeCompile={(shader) => injectHairShader(shader, uniforms)}
      />
    </mesh>
  );
}
