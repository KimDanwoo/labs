'use client';

import { FLORA, floraCellOf, floraInCell, type FloraPlacement } from '@entities/flora/model/constants';
import { useFrame } from '@react-three/fiber';
import { distanceToRiver, riverBedDepthAt } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';

const dummy = new Object3D();
const tint = new Color();
const CANOPY_COLORS = FLORA.colors.canopy.map((hex) => new Color(hex));

// 나무(줄기 + 캐노피 덩어리 3개)·바위를 InstancedMesh 세 장으로 그린다. 지오메트리 병합 없이 캐노피 덩어리를 인스턴스로 흩는다.
// 카메라 셀이 바뀔 때만 주변 셀의 배치를 다시 쓴다(수백 개 → 무시할 비용).
export function FloraField() {
  const coarse = useIsCoarsePointer();
  const viewRadius = coarse ? FLORA.viewRadius.mobile : FLORA.viewRadius.desktop;
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);
  const rockRef = useRef<InstancedMesh>(null);
  const centerRef = useRef({ x: Number.NaN, z: Number.NaN });

  const maxCanopy = FLORA.maxTrees * FLORA.canopy.blobs;
  const blobOffsets = useMemo(
    () =>
      Array.from({ length: FLORA.canopy.blobs }, (_, i) => {
        const angle = (i / FLORA.canopy.blobs) * Math.PI * 2;
        return { x: Math.cos(angle) * 0.9, y: 0.6 - i * 0.35, z: Math.sin(angle) * 0.9, r: 1 - i * 0.12 };
      }),
    [],
  );

  const rebuild = (cx: number, cz: number) => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    const rock = rockRef.current;
    if (!trunk || !canopy || !rock) return;

    const items: FloraPlacement[] = [];
    for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
      for (let dz = -viewRadius; dz <= viewRadius; dz += 1) items.push(...floraInCell(cx + dx, cz + dz));
    }

    let trees = 0;
    let blobs = 0;
    let rocks = 0;
    for (const item of items) {
      const groundY = -riverBedDepthAt(distanceToRiver(item.x));
      if (item.kind === 'rock') {
        if (rocks >= FLORA.maxRocks) continue;
        dummy.position.set(item.x, groundY - 0.2 * item.scale, item.z);
        dummy.rotation.set(0, item.yaw, 0);
        dummy.scale.set(item.scale, item.scale * 0.65, item.scale * 0.85);
        dummy.updateMatrix();
        rock.setMatrixAt(rocks, dummy.matrix);
        rocks += 1;
        continue;
      }
      if (trees >= FLORA.maxTrees) continue;
      const trunkH = FLORA.trunk.height * item.scale;
      dummy.position.set(item.x, groundY + trunkH / 2, item.z);
      dummy.rotation.set(0, item.yaw, 0);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();
      trunk.setMatrixAt(trees, dummy.matrix);
      trees += 1;

      tint.copy(CANOPY_COLORS[item.variant] ?? CANOPY_COLORS[0]!);
      for (const blob of blobOffsets) {
        const s = item.scale * blob.r;
        dummy.position.set(
          item.x + blob.x * item.scale,
          groundY + trunkH + (FLORA.canopy.radius * 0.7 + blob.y) * item.scale,
          item.z + blob.z * item.scale,
        );
        dummy.rotation.set(0, item.yaw + blob.x, 0);
        dummy.scale.set(s, s * 0.85, s);
        dummy.updateMatrix();
        canopy.setMatrixAt(blobs, dummy.matrix);
        canopy.setColorAt(blobs, tint);
        blobs += 1;
      }
    }

    trunk.count = trees;
    canopy.count = blobs;
    rock.count = rocks;
    trunk.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
    rock.instanceMatrix.needsUpdate = true;
    if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
    trunk.computeBoundingSphere();
    canopy.computeBoundingSphere();
    rock.computeBoundingSphere();
  };

  useLayoutEffect(() => {
    centerRef.current = { x: Number.NaN, z: Number.NaN };
  }, [viewRadius]);

  useFrame((state) => {
    const cx = floraCellOf(state.camera.position.x);
    const cz = floraCellOf(state.camera.position.z);
    if (cx === centerRef.current.x && cz === centerRef.current.z) return;
    centerRef.current = { x: cx, z: cz };
    rebuild(cx, cz);
  });

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, FLORA.maxTrees]}>
        <cylinderGeometry
          args={[FLORA.trunk.radiusTop, FLORA.trunk.radiusBottom, FLORA.trunk.height, FLORA.trunk.segments]}
        />
        <meshLambertMaterial color={FLORA.colors.trunk} flatShading />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, maxCanopy]}>
        <icosahedronGeometry args={[FLORA.canopy.radius, FLORA.canopy.detail]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, FLORA.maxRocks]}>
        <icosahedronGeometry args={[FLORA.rock.radius, FLORA.rock.detail]} />
        <meshLambertMaterial color={FLORA.colors.rock} flatShading />
      </instancedMesh>
    </group>
  );
}
