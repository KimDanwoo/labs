'use client';

import { useLowDetail } from '../../model/ride-state/sceneQuality';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { DoubleSide, InstancedMesh } from 'three';
import { FLORA, floraCellOf } from '../../model/flora/constants';

import { shadeCanopy, shadeConifer, timeUniform } from '../../lib/flora/floraField';
import { placeFlora } from '../../lib/flora/placeFlora';
import { useFloraResources } from '../../model/flora/useFloraResources';
import { MeadowFlowers } from './MeadowFlowers';

// 줄기·가지, 잎 군집, 침엽수, 바위, 접지 음영을 다섯 InstancedMesh로 그린다.
// 카메라 셀이 바뀔 때만 주변 셀의 배치를 다시 쓴다(수백 개 → 무시할 비용).
export function FloraField() {
  const coarse = useLowDetail();
  const viewRadius = coarse ? FLORA.viewRadius.mobile : FLORA.viewRadius.desktop;
  const { geometry, surface, shadowTexture } = useFloraResources(coarse);
  const shadowRef = useRef<InstancedMesh>(null);
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);
  const farCanopyRef = useRef<InstancedMesh>(null);
  const coneRef = useRef<InstancedMesh>(null);
  const rockRef = useRef<InstancedMesh>(null);
  const centerRef = useRef({ x: Number.NaN, z: Number.NaN });

  const rebuild = (cx: number, cz: number) => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    const farCanopy = farCanopyRef.current;
    const cone = coneRef.current;
    const rock = rockRef.current;
    const shadow = shadowRef.current;
    if (!trunk || !canopy || !farCanopy || !cone || !rock || !shadow) return;

    placeFlora({ trunk, canopy, farCanopy, cone, rock, shadow }, cx, cz, viewRadius, coarse);
  };

  useLayoutEffect(() => {
    centerRef.current = { x: Number.NaN, z: Number.NaN };
  }, [viewRadius]);

  useFrame((state) => {
    timeUniform.value = state.clock.elapsedTime;
    const cx = floraCellOf(state.camera.position.x);
    const cz = floraCellOf(state.camera.position.z);
    if (cx === centerRef.current.x && cz === centerRef.current.z) return;
    centerRef.current = { x: cx, z: cz };
    rebuild(cx, cz);
  });

  return (
    <group>
      <MeadowFlowers />
      <instancedMesh ref={trunkRef} args={[geometry.trunk, undefined, FLORA.maxTrees * (FLORA.branches + 1)]}>
        <meshStandardMaterial color={FLORA.colors.trunk} roughness={0.95} bumpMap={surface.bark} bumpScale={0.16} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[geometry.canopy, undefined, FLORA.maxTrees * FLORA.canopy.blobs]}>
        <meshStandardMaterial
          vertexColors
          side={DoubleSide}
          roughness={0.82}
          envMapIntensity={0.25}
          onBeforeCompile={shadeCanopy}
        />
      </instancedMesh>
      <instancedMesh ref={farCanopyRef} args={[geometry.farCanopy, undefined, FLORA.maxTrees * 6]}>
        <meshLambertMaterial onBeforeCompile={shadeCanopy} />
      </instancedMesh>
      <instancedMesh ref={coneRef} args={[geometry.conifer, undefined, FLORA.maxTrees * FLORA.conifer.tiers]}>
        <meshLambertMaterial onBeforeCompile={shadeConifer} />
      </instancedMesh>
      <instancedMesh ref={shadowRef} args={[undefined, undefined, FLORA.maxTrees + FLORA.maxRocks]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTexture} color="#293221" transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[geometry.rock, undefined, FLORA.maxRocks]}>
        <meshStandardMaterial
          color={FLORA.colors.rock}
          vertexColors
          roughness={0.95}
          bumpMap={surface.stone}
          bumpScale={0.12}
        />
      </instancedMesh>
    </group>
  );
}
