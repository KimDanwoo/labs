'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';
import {
  GRAZER_DARK_SLOTS,
  GRAZER_EYE_GEOMETRY,
  GRAZER_EYE_ROUGHNESS,
  GRAZER_EYE_SLOTS,
  GRAZER_FUR_BUMP_SCALE,
  GRAZER_FUR_SLOTS,
  GRAZER_HERD_SIZE,
  GRAZER_HERD_SIZE_LOW,
  GRAZER_MAX_DELTA,
  GRAZER_OFFSHORE_DISTANCE,
} from '../../config/grazers';
import { makeSurfaceBump, SURFACE_KIND } from '../../lib/makeSurfaceBump';
import { coastDistanceAt } from '../../lib/scene/terrain';
import { placeGrazerParts, spawnHerd, stepGrazer } from '../../lib/wildlife/grazerHerd';
import { useDispose } from '../../model/hooks/useDispose';
import { runnerState } from '../../model/ride-state/runnerState';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

export function Grazers() {
  const mobile = useLowDetail();
  const count = mobile ? GRAZER_HERD_SIZE_LOW : GRAZER_HERD_SIZE;
  const fur = useRef<InstancedMesh>(null);
  const dark = useRef<InstancedMesh>(null);
  const eyes = useRef<InstancedMesh>(null);
  const wool = useMemo(() => makeSurfaceBump(SURFACE_KIND.wool), []);
  useDispose(wool);
  const dummy = useRef(new Object3D());
  const herd = useRef(spawnHerd());
  useFrame(({ clock }, delta) => {
    if (!fur.current || !dark.current || !eyes.current) return;
    const dt = Math.min(delta, GRAZER_MAX_DELTA),
      t = clock.elapsedTime,
      rider = runnerState.position;
    const offshore = coastDistanceAt(rider.x, rider.z) > GRAZER_OFFSHORE_DISTANCE;
    fur.current.visible = dark.current.visible = eyes.current.visible = !offshore;
    if (offshore) return;
    const meshes = { fur: fur.current, dark: dark.current, eyes: eyes.current };
    for (let i = 0; i < count; i++) {
      const animal = herd.current[i]!;
      const grazing = stepGrazer(animal, rider, i, t, dt);
      placeGrazerParts(meshes, dummy.current, animal, i, grazing, t);
    }
    fur.current.instanceMatrix.needsUpdate = true;
    dark.current.instanceMatrix.needsUpdate = true;
    eyes.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={fur} args={[undefined, undefined, count * GRAZER_FUR_SLOTS]} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#ded6c2" roughness={1} bumpMap={wool} bumpScale={GRAZER_FUR_BUMP_SCALE} />
      </instancedMesh>
      <instancedMesh ref={eyes} args={[undefined, undefined, count * GRAZER_EYE_SLOTS]} frustumCulled={false}>
        <sphereGeometry args={GRAZER_EYE_GEOMETRY} />
        <meshPhysicalMaterial color="#161e24" roughness={GRAZER_EYE_ROUGHNESS} clearcoat={1} />
      </instancedMesh>
      <instancedMesh
        ref={dark}
        args={[undefined, undefined, count * GRAZER_DARK_SLOTS]}
        frustumCulled={false}
        castShadow
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#625b4c" roughness={1} />
      </instancedMesh>
    </group>
  );
}
