'use client';

import { useLowDetail } from '../../model/ride-state/sceneQuality';

import { useRef } from 'react';
import { DoubleSide, InstancedMesh } from 'three';
import { FLORA_VIEW } from '../../config/floraView';
import { FLORA } from '../../model/flora/constants';

import { shadeCanopy, shadeConifer } from '../../lib/flora/floraField';
import { useFloraPlacement } from '../../model/flora/useFloraPlacement';
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
  useFloraPlacement(
    { trunk: trunkRef, canopy: canopyRef, farCanopy: farCanopyRef, cone: coneRef, rock: rockRef, shadow: shadowRef },
    viewRadius,
    coarse,
  );

  return (
    <group>
      <MeadowFlowers />
      <instancedMesh ref={trunkRef} args={[geometry.trunk, undefined, FLORA.maxTrees * (FLORA.branches + 1)]}>
        <meshStandardMaterial
          color={FLORA.colors.trunk}
          roughness={FLORA_VIEW.trunk.roughness}
          bumpMap={surface.bark}
          bumpScale={FLORA_VIEW.trunk.bumpScale}
        />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[geometry.canopy, undefined, FLORA.maxTrees * FLORA.canopy.blobs]}>
        <meshStandardMaterial
          vertexColors
          side={DoubleSide}
          roughness={FLORA_VIEW.canopy.roughness}
          envMapIntensity={FLORA_VIEW.canopy.envMapIntensity}
          onBeforeCompile={shadeCanopy}
        />
      </instancedMesh>
      <instancedMesh ref={farCanopyRef} args={[geometry.farCanopy, undefined, FLORA.maxTrees * FLORA.canopy.farBlobs]}>
        <meshLambertMaterial onBeforeCompile={shadeCanopy} />
      </instancedMesh>
      <instancedMesh ref={coneRef} args={[geometry.conifer, undefined, FLORA.maxTrees * FLORA.conifer.tiers]}>
        <meshLambertMaterial onBeforeCompile={shadeConifer} />
      </instancedMesh>
      <instancedMesh ref={shadowRef} args={[undefined, undefined, FLORA.maxTrees + FLORA.maxRocks]}>
        <planeGeometry args={FLORA_VIEW.shadow.geometry} />
        <meshBasicMaterial
          map={shadowTexture}
          color={FLORA_VIEW.shadow.color}
          transparent
          opacity={FLORA_VIEW.shadow.opacity}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[geometry.rock, undefined, FLORA.maxRocks]}>
        <meshStandardMaterial
          color={FLORA.colors.rock}
          vertexColors
          roughness={FLORA_VIEW.rock.roughness}
          bumpMap={surface.stone}
          bumpScale={FLORA_VIEW.rock.bumpScale}
        />
      </instancedMesh>
    </group>
  );
}
