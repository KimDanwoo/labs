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

interface Counters {
  trunks: number;
  trees: number;
  shadows: number;
  blobs: number;
  farBlobs: number;
  cones: number;
  rocks: number;
}

interface Site {
  item: FloraPlacement;
  groundY: number;
  distant: boolean;
}

const DISTANT_RANGE = { mobile: 48, desktop: 96 } as const;
const DISTANT_BLOBS = 6;
const SHADOW_LIFT = 0.025;
const SHADOW_SIZE = { rock: 1.6, tree: 5.4 } as const;
const SHADOW_SQUASH = 0.75;
const ROCK_SINK = 0.2;
const ROCK_SQUASH = { y: 0.65, z: 0.85 } as const;
const TRUNK_WIDTH = 0.9;
const CONIFER_TRUNK_BOOST = 1.3;
const TIER_SHRINK = 0.145;
const TIER_BASE = 0.45;
const TIER_STEP = 0.55;
const TIER_TWIST = 0.7;
const SEED_SCALE = { x: 7.13, z: 3.71 } as const;
const BRANCH_WIDTH = 0.34;

function collectItems(cx: number, cz: number, viewRadius: number): FloraPlacement[] {
  const items: FloraPlacement[] = [];
  for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
    for (let dz = -viewRadius; dz <= viewRadius; dz += 1) items.push(...floraInCell(cx + dx, cz + dz));
  }
  // 넓어진 시야에서도 가까운 식생부터 예산을 배정한다.
  const centerX = cx * FLORA.cell;
  const centerZ = cz * FLORA.cell;
  items.sort((a, b) => (a.x - centerX) ** 2 + (a.z - centerZ) ** 2 - ((b.x - centerX) ** 2 + (b.z - centerZ) ** 2));
  return items;
}

function placeShadow(shadow: InstancedMesh, c: Counters, { item, groundY }: Site): void {
  if (c.shadows >= FLORA.maxTrees + FLORA.maxRocks) return;
  const shadeSize = item.scale * (item.kind === 'rock' ? SHADOW_SIZE.rock : SHADOW_SIZE.tree);
  dummy.position.set(item.x, groundY + SHADOW_LIFT, item.z);
  dummy.rotation.set(-Math.PI / 2, 0, item.yaw);
  dummy.scale.set(shadeSize, shadeSize * SHADOW_SQUASH, 1);
  dummy.updateMatrix();
  shadow.setMatrixAt(c.shadows, dummy.matrix);
  c.shadows += 1;
}

function placeRock(rock: InstancedMesh, c: Counters, { item, groundY }: Site): void {
  if (c.rocks >= FLORA.maxRocks) return;
  dummy.position.set(item.x, groundY - ROCK_SINK * item.scale, item.z);
  dummy.rotation.set(0, item.yaw, 0);
  dummy.scale.set(item.scale, item.scale * ROCK_SQUASH.y, item.scale * ROCK_SQUASH.z);
  dummy.updateMatrix();
  rock.setMatrixAt(c.rocks, dummy.matrix);
  c.rocks += 1;
}

function placeTrunk(trunk: InstancedMesh, c: Counters, { item, groundY }: Site, trunkH: number): void {
  dummy.position.set(item.x, groundY + trunkH / 2, item.z);
  dummy.rotation.set(0, item.yaw, 0);
  dummy.scale.set(item.scale * TRUNK_WIDTH, trunkH, item.scale * TRUNK_WIDTH);
  dummy.updateMatrix();
  trunk.setMatrixAt(c.trunks, dummy.matrix);
  c.trunks += 1;
}

function placeConifer(cone: InstancedMesh, c: Counters, { item, groundY }: Site, trunkH: number): void {
  tint.copy(CONIFER_COLORS[item.variant % CONIFER_COLORS.length]!);
  const { tiers, tierHeight } = FLORA.conifer;
  for (let t = 0; t < tiers; t += 1) {
    // 아래 단이 넓고 위로 갈수록 좁고 높이 겹친다.
    const shrink = 1 - t * TIER_SHRINK;
    const y = groundY + trunkH * TIER_BASE + t * tierHeight * TIER_STEP * item.scale + (tierHeight / 2) * item.scale;
    dummy.position.set(item.x, y, item.z);
    dummy.rotation.set(0, item.yaw + t * TIER_TWIST, 0);
    dummy.scale.set(item.scale * shrink, item.scale, item.scale * shrink);
    dummy.updateMatrix();
    cone.setMatrixAt(c.cones, dummy.matrix);
    cone.setColorAt(c.cones, tint);
    c.cones += 1;
  }
}

function placeBranch(trunk: InstancedMesh, c: Counters, site: Site, trunkH: number, blob: BlobShape): void {
  const { item, groundY } = site;
  const startY = groundY + trunkH * (0.5 + blob.r3 * 0.2);
  const endY = groundY + trunkH + FLORA.canopy.radius * (0.3 + blob.lift) * item.scale;
  branchDirection.set(Math.cos(blob.angle) * blob.spread, endY - startY, Math.sin(blob.angle) * blob.spread);
  const length = branchDirection.length();
  dummy.position.set(item.x + branchDirection.x / 2, startY + branchDirection.y / 2, item.z + branchDirection.z / 2);
  dummy.quaternion.setFromUnitVectors(up, branchDirection.normalize());
  dummy.scale.set(item.scale * BRANCH_WIDTH, length, item.scale * BRANCH_WIDTH);
  dummy.updateMatrix();
  trunk.setMatrixAt(c.trunks, dummy.matrix);
  c.trunks += 1;
}

interface BlobShape {
  r1: number;
  r3: number;
  angle: number;
  spread: number;
  lift: number;
}

function blobShapeOf(seed: number, b: number, scale: number): BlobShape & { radiusScale: number } {
  const r1 = hash(seed + b * 1.37);
  const r2 = hash(seed + b * 2.91 + 5);
  const r3 = hash(seed + b * 4.07 + 9);
  // 첫 덩어리는 중심에 크게, 나머지는 주변에 작게·낮게 — 둥글되 울퉁불퉁한 실루엣.
  return {
    r1,
    r3,
    angle: r1 * Math.PI * 2,
    spread: b === 0 ? 0.3 : (0.9 + r2 * 1.5) * scale,
    radiusScale: b === 0 ? 0.85 : 0.38 + r3 * 0.36,
    lift: b === 0 ? 0.5 : -0.35 + r2 * 0.65,
  };
}

function placeCanopy(meshes: FloraMeshes, c: Counters, site: Site, trunkH: number): void {
  const { item, groundY, distant } = site;
  const seed = item.x * SEED_SCALE.x + item.z * SEED_SCALE.z;
  for (let b = 0; b < (distant ? DISTANT_BLOBS : FLORA.canopy.blobs); b += 1) {
    const blob = blobShapeOf(seed, b, item.scale);
    dummy.position.set(
      item.x + Math.cos(blob.angle) * blob.spread,
      groundY + trunkH + FLORA.canopy.radius * (0.55 + blob.lift) * item.scale,
      item.z + Math.sin(blob.angle) * blob.spread,
    );
    dummy.rotation.set(0, blob.angle, 0);
    const s = item.scale * blob.radiusScale;
    dummy.scale.set(s * (0.9 + blob.r1 * 0.35), s * (0.65 + blob.r3 * 0.3), s);
    dummy.updateMatrix();
    tint.copy(CANOPY_COLORS[(item.variant + b) % CANOPY_COLORS.length]!);
    const foliage = distant ? meshes.farCanopy : meshes.canopy;
    const slot = distant ? c.farBlobs++ : c.blobs++;
    foliage.setMatrixAt(slot, dummy.matrix);
    foliage.setColorAt(slot, tint);
    if (!distant && b > 0 && b <= FLORA.branches) placeBranch(meshes.trunk, c, site, trunkH, blob);
  }
}

function placeTree(meshes: FloraMeshes, c: Counters, site: Site): void {
  const isConifer = site.item.kind === 'conifer';
  const trunkH = FLORA.trunk.height * site.item.scale * (isConifer ? CONIFER_TRUNK_BOOST : 1);
  placeTrunk(meshes.trunk, c, site, trunkH);
  if (isConifer) placeConifer(meshes.cone, c, site, trunkH);
  else placeCanopy(meshes, c, site, trunkH);
}

function placeItem(meshes: FloraMeshes, c: Counters, site: Site): void {
  placeShadow(meshes.shadow, c, site);
  if (site.item.kind === 'rock') {
    placeRock(meshes.rock, c, site);
    return;
  }
  if (c.trees >= FLORA.maxTrees) return;
  c.trees += 1;
  placeTree(meshes, c, site);
}

function commitCounts(meshes: FloraMeshes, c: Counters): void {
  meshes.shadow.count = c.shadows;
  meshes.trunk.count = c.trunks;
  meshes.canopy.count = c.blobs;
  meshes.farCanopy.count = c.farBlobs;
  meshes.cone.count = c.cones;
  meshes.rock.count = c.rocks;
  for (const mesh of Object.values(meshes)) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
}

export function placeFlora(meshes: FloraMeshes, cx: number, cz: number, viewRadius: number, coarse: boolean) {
  const centerX = cx * FLORA.cell;
  const centerZ = cz * FLORA.cell;
  const quality = coarse ? 'mobile' : 'desktop';
  const counters: Counters = { trunks: 0, trees: 0, shadows: 0, blobs: 0, farBlobs: 0, cones: 0, rocks: 0 };
  for (const item of collectItems(cx, cz, viewRadius)) {
    const distance = Math.hypot(item.x - centerX, item.z - centerZ);
    if (distance > FOG[quality].far + FLORA.cell) continue;
    const site = { item, groundY: groundHeightAt(item.x, item.z), distant: distance > DISTANT_RANGE[quality] };
    placeItem(meshes, counters, site);
  }
  commitCounts(meshes, counters);
}
