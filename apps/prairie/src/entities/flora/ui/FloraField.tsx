'use client';

import { FLORA, floraCellOf, floraInCell, type FloraPlacement } from '@entities/flora/model/constants';
import { useFrame } from '@react-three/fiber';
import { distanceToRiver, riverBedDepthAt, terrainHeightAt } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { useLayoutEffect, useRef } from 'react';
import { Color, InstancedMesh, Object3D, type WebGLProgramParametersWithUniforms } from 'three';

const dummy = new Object3D();
const tint = new Color();
const CANOPY_COLORS = FLORA.colors.canopy.map((hex) => new Color(hex));
const CONIFER_COLORS = FLORA.colors.conifer.map((hex) => new Color(hex));
const timeUniform = { value: 0 };

function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// 캐노피 잎 머티리얼: 세로 명암(밑은 그늘, 위는 햇빛) + 인스턴스 위치로 위상을 흩은 바람 흔들림.
// 오브젝트 좌표 y를 쓰므로 덩어리·원뿔 모두 "아래 어둡고 위 밝은" 결과가 된다.
function makeFoliageShader(halfHeight: number) {
  return (shader: WebGLProgramParametersWithUniforms): void => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vFoliageT;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vFoliageT = clamp(position.y / ${halfHeight.toFixed(3)} * 0.5 + 0.5, 0.0, 1.0);
        vec2 anchor = instanceMatrix[3].xz;
        float sway = sin(uTime * 1.4 + anchor.x * 0.37 + anchor.y * 0.29) * ${FLORA.sway.toFixed(3)} * vFoliageT;
        transformed.x += sway;
        transformed.z += sway * 0.6;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFoliageT;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        diffuseColor.rgb *= mix(${FLORA.shadeBottom.toFixed(2)}, ${FLORA.shadeTop.toFixed(2)}, vFoliageT);`,
      );
  };
}

const shadeCanopy = makeFoliageShader(FLORA.canopy.radius);
const shadeConifer = makeFoliageShader(FLORA.conifer.tierHeight / 2);

// 나무(줄기 + 캐노피 덩어리)·침엽수(줄기 + 원뿔 단)·바위를 InstancedMesh 네 장으로 그린다. 지오메트리 병합 없이 부위를 인스턴스로 흩는다.
// 카메라 셀이 바뀔 때만 주변 셀의 배치를 다시 쓴다(수백 개 → 무시할 비용).
export function FloraField() {
  const coarse = useIsCoarsePointer();
  const viewRadius = coarse ? FLORA.viewRadius.mobile : FLORA.viewRadius.desktop;
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);
  const coneRef = useRef<InstancedMesh>(null);
  const rockRef = useRef<InstancedMesh>(null);
  const centerRef = useRef({ x: Number.NaN, z: Number.NaN });

  const rebuild = (cx: number, cz: number) => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    const cone = coneRef.current;
    const rock = rockRef.current;
    if (!trunk || !canopy || !cone || !rock) return;

    const items: FloraPlacement[] = [];
    for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
      for (let dz = -viewRadius; dz <= viewRadius; dz += 1) items.push(...floraInCell(cx + dx, cz + dz));
    }

    let trunks = 0;
    let blobs = 0;
    let cones = 0;
    let rocks = 0;
    for (const item of items) {
      const groundY = terrainHeightAt(item.x, item.z) - riverBedDepthAt(distanceToRiver(item.x));
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
      if (trunks >= FLORA.maxTrees) continue;
      const isConifer = item.kind === 'conifer';
      const trunkH = FLORA.trunk.height * item.scale * (isConifer ? 1.3 : 1);
      dummy.position.set(item.x, groundY + trunkH / 2, item.z);
      dummy.rotation.set(0, item.yaw, 0);
      dummy.scale.set(item.scale * 0.9, trunkH / FLORA.trunk.height, item.scale * 0.9);
      dummy.updateMatrix();
      trunk.setMatrixAt(trunks, dummy.matrix);
      trunks += 1;

      if (isConifer) {
        tint.copy(CONIFER_COLORS[item.variant % CONIFER_COLORS.length]!);
        const { tiers, tierHeight } = FLORA.conifer;
        for (let t = 0; t < tiers; t += 1) {
          // 아래 단이 넓고 위로 갈수록 좁고 높이 겹친다.
          const shrink = 1 - t * 0.26;
          const y = groundY + trunkH * 0.45 + t * tierHeight * 0.62 * item.scale + (tierHeight / 2) * item.scale;
          dummy.position.set(item.x, y, item.z);
          dummy.rotation.set(0, item.yaw + t * 0.7, 0);
          dummy.scale.set(item.scale * shrink, item.scale, item.scale * shrink);
          dummy.updateMatrix();
          cone.setMatrixAt(cones, dummy.matrix);
          cone.setColorAt(cones, tint);
          cones += 1;
        }
        continue;
      }

      const seed = item.x * 7.13 + item.z * 3.71;
      for (let b = 0; b < FLORA.canopy.blobs; b += 1) {
        const r1 = hash(seed + b * 1.37);
        const r2 = hash(seed + b * 2.91 + 5);
        const r3 = hash(seed + b * 4.07 + 9);
        const angle = r1 * Math.PI * 2;
        // 첫 덩어리는 중심에 크게, 나머지는 주변에 작게·낮게 — 둥글되 울퉁불퉁한 실루엣.
        const spread = b === 0 ? 0 : (0.45 + r2 * 0.55) * item.scale;
        const radiusScale = b === 0 ? 1 : 0.55 + r3 * 0.35;
        const lift = b === 0 ? 0.3 : -0.1 + r2 * 0.5;
        dummy.position.set(
          item.x + Math.cos(angle) * spread,
          groundY + trunkH + FLORA.canopy.radius * (0.55 + lift) * item.scale,
          item.z + Math.sin(angle) * spread,
        );
        dummy.rotation.set(0, angle, 0);
        const s = item.scale * radiusScale;
        dummy.scale.set(s, s * 0.82, s);
        dummy.updateMatrix();
        tint.copy(CANOPY_COLORS[(item.variant + b) % CANOPY_COLORS.length]!);
        canopy.setMatrixAt(blobs, dummy.matrix);
        canopy.setColorAt(blobs, tint);
        blobs += 1;
      }
    }

    trunk.count = trunks;
    canopy.count = blobs;
    cone.count = cones;
    rock.count = rocks;
    for (const mesh of [trunk, canopy, cone, rock]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
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
      <instancedMesh ref={trunkRef} args={[undefined, undefined, FLORA.maxTrees]}>
        <cylinderGeometry
          args={[FLORA.trunk.radiusTop, FLORA.trunk.radiusBottom, FLORA.trunk.height, FLORA.trunk.segments]}
        />
        <meshLambertMaterial color={FLORA.colors.trunk} flatShading />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, FLORA.maxTrees * FLORA.canopy.blobs]}>
        <icosahedronGeometry args={[FLORA.canopy.radius, FLORA.canopy.detail]} />
        <meshLambertMaterial flatShading onBeforeCompile={shadeCanopy} />
      </instancedMesh>
      <instancedMesh ref={coneRef} args={[undefined, undefined, FLORA.maxTrees * FLORA.conifer.tiers]}>
        <coneGeometry args={[FLORA.conifer.radius, FLORA.conifer.tierHeight, FLORA.conifer.segments]} />
        <meshLambertMaterial flatShading onBeforeCompile={shadeConifer} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, FLORA.maxRocks]}>
        <icosahedronGeometry args={[FLORA.rock.radius, FLORA.rock.detail]} />
        <meshLambertMaterial color={FLORA.colors.rock} flatShading />
      </instancedMesh>
    </group>
  );
}
