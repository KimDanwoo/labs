import type { InstancedMesh } from 'three';
import { FOG } from '../../config/scene';
import { FLORA, floraInCell, type FloraPlacement } from '../../model/flora/constants';
import { groundHeightAt } from '../scene/terrain';
import { branchDirection, CANOPY_COLORS, CONIFER_COLORS, dummy, hash, tint, up } from './floraField';

export type FloraMeshes = {
  trunk: InstancedMesh;
  canopy: InstancedMesh;
  farCanopy: InstancedMesh;
  cone: InstancedMesh;
  rock: InstancedMesh;
  shadow: InstancedMesh;
};

export function placeFlora(
  { trunk, canopy, farCanopy, cone, rock, shadow }: FloraMeshes,
  cx: number,
  cz: number,
  viewRadius: number,
  coarse: boolean,
) {
  const items: FloraPlacement[] = [];
  for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
    for (let dz = -viewRadius; dz <= viewRadius; dz += 1) items.push(...floraInCell(cx + dx, cz + dz));
  }

  // 넓어진 시야에서도 가까운 식생부터 예산을 배정한다.
  const centerX = cx * FLORA.cell;
  const centerZ = cz * FLORA.cell;
  items.sort((a, b) => (a.x - centerX) ** 2 + (a.z - centerZ) ** 2 - ((b.x - centerX) ** 2 + (b.z - centerZ) ** 2));

  let trunks = 0;
  let trees = 0;
  let shadows = 0;
  let blobs = 0;
  let farBlobs = 0;
  let cones = 0;
  let rocks = 0;
  for (const item of items) {
    const distance = Math.hypot(item.x - centerX, item.z - centerZ);
    if (distance > FOG[coarse ? 'mobile' : 'desktop'].far + FLORA.cell) continue;
    const distant = distance > (coarse ? 48 : 96);
    const groundY = groundHeightAt(item.x, item.z);
    if (shadows < FLORA.maxTrees + FLORA.maxRocks) {
      const shadeSize = item.scale * (item.kind === 'rock' ? 1.6 : 5.4);
      dummy.position.set(item.x, groundY + 0.025, item.z);
      dummy.rotation.set(-Math.PI / 2, 0, item.yaw);
      dummy.scale.set(shadeSize, shadeSize * 0.75, 1);
      dummy.updateMatrix();
      shadow.setMatrixAt(shadows, dummy.matrix);
      shadows += 1;
    }
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
    trees += 1;
    const isConifer = item.kind === 'conifer';
    const trunkH = FLORA.trunk.height * item.scale * (isConifer ? 1.3 : 1);
    dummy.position.set(item.x, groundY + trunkH / 2, item.z);
    dummy.rotation.set(0, item.yaw, 0);
    dummy.scale.set(item.scale * 0.9, trunkH, item.scale * 0.9);
    dummy.updateMatrix();
    trunk.setMatrixAt(trunks, dummy.matrix);
    trunks += 1;

    if (isConifer) {
      tint.copy(CONIFER_COLORS[item.variant % CONIFER_COLORS.length]!);
      const { tiers, tierHeight } = FLORA.conifer;
      for (let t = 0; t < tiers; t += 1) {
        // 아래 단이 넓고 위로 갈수록 좁고 높이 겹친다.
        const shrink = 1 - t * 0.145;
        const y = groundY + trunkH * 0.45 + t * tierHeight * 0.55 * item.scale + (tierHeight / 2) * item.scale;
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
    for (let b = 0; b < (distant ? 6 : FLORA.canopy.blobs); b += 1) {
      const r1 = hash(seed + b * 1.37);
      const r2 = hash(seed + b * 2.91 + 5);
      const r3 = hash(seed + b * 4.07 + 9);
      const angle = r1 * Math.PI * 2;
      // 첫 덩어리는 중심에 크게, 나머지는 주변에 작게·낮게 — 둥글되 울퉁불퉁한 실루엣.
      const spread = b === 0 ? 0.3 : (0.9 + r2 * 1.5) * item.scale;
      const radiusScale = b === 0 ? 0.85 : 0.38 + r3 * 0.36;
      const lift = b === 0 ? 0.5 : -0.35 + r2 * 0.65;
      dummy.position.set(
        item.x + Math.cos(angle) * spread,
        groundY + trunkH + FLORA.canopy.radius * (0.55 + lift) * item.scale,
        item.z + Math.sin(angle) * spread,
      );
      dummy.rotation.set(0, angle, 0);
      const s = item.scale * radiusScale;
      dummy.scale.set(s * (0.9 + r1 * 0.35), s * (0.65 + r3 * 0.3), s);
      dummy.updateMatrix();
      tint.copy(CANOPY_COLORS[(item.variant + b) % CANOPY_COLORS.length]!);
      const foliage = distant ? farCanopy : canopy;
      const slot = distant ? farBlobs++ : blobs++;
      foliage.setMatrixAt(slot, dummy.matrix);
      foliage.setColorAt(slot, tint);
      if (!distant && b > 0 && b <= FLORA.branches) {
        const startY = groundY + trunkH * (0.5 + r3 * 0.2);
        const endY = groundY + trunkH + FLORA.canopy.radius * (0.3 + lift) * item.scale;
        branchDirection.set(Math.cos(angle) * spread, endY - startY, Math.sin(angle) * spread);
        const length = branchDirection.length();
        dummy.position.set(
          item.x + branchDirection.x / 2,
          startY + branchDirection.y / 2,
          item.z + branchDirection.z / 2,
        );
        dummy.quaternion.setFromUnitVectors(up, branchDirection.normalize());
        dummy.scale.set(item.scale * 0.34, length, item.scale * 0.34);
        dummy.updateMatrix();
        trunk.setMatrixAt(trunks, dummy.matrix);
        trunks += 1;
      }
    }
  }

  shadow.count = shadows;
  trunk.count = trunks;
  canopy.count = blobs;
  farCanopy.count = farBlobs;
  cone.count = cones;
  rock.count = rocks;
  for (const mesh of [trunk, canopy, farCanopy, cone, rock, shadow]) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
}
