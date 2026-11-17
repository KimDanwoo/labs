import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import { repaintSlots } from './islandGeometry';
import { type IslandModelKey, islandModelGeometry, islandPaletteMaterial } from './islandModels';

interface Lane {
  readonly x: number;
  readonly y: number;
}

interface CareerTrack extends Lane {
  readonly start: number;
  readonly end: number;
  readonly hasEnd: boolean;
}

const DYE_SLOT = 13;
const DYES = new Map<unknown, number>([
  ['blue', 3],
  ['orange', 16],
  ['purple', 8],
  ['green', 9],
]);
const OLD_TRACKS = ['Plane018', 'Plane022', 'Plane035', 'Plane048', 'Plane049'];
const TIMELINE = 'Plane048';
const LINE = /^refLine/;
const STONE = /^stone/;
const STONE_POST = /_1$/;
const ROPE_UNIT = 1;
const MIN_ROPE = 0.02;
const RING_RADIUS = 0.33;
const BUTTON_RADIUS = 0.25;
const STAKE_GAP = 0.42;
const ROPE_GIRTH = 1.3;

interface Placement extends Lane {
  readonly z: number;
  readonly scale?: THREE.Vector3;
}

const UNIT_SCALE = new THREE.Vector3(1, 1, 1);

function placed(key: IslandModelKey, { x, y, z, scale = UNIT_SCALE }: Placement): THREE.BufferGeometry {
  return islandModelGeometry(key, { matrix: new THREE.Matrix4().makeTranslation(x, y, z).scale(scale) });
}

function rope(lane: Lane, from: number, to: number): THREE.BufferGeometry[] {
  const length = Math.abs(to - from);
  if (length < MIN_ROPE) return [];
  const count = Math.max(1, Math.round(length / ROPE_UNIT));
  const step = (to - from) / count;
  return Array.from({ length: count }, (_, index) =>
    placed('careerRope', {
      ...lane,
      z: from + step * (index + 0.5),
      scale: new THREE.Vector3(ROPE_GIRTH, ROPE_GIRTH, Math.abs(step) / ROPE_UNIT),
    }),
  );
}

function tiedRope(lane: Lane, from: number, to: number): THREE.BufferGeometry[] {
  return [
    placed('careerStake', { ...lane, z: from }),
    ...rope(lane, from, to),
    placed('careerStake', { ...lane, z: to }),
  ];
}

function careerLineGeometries(track: CareerTrack): THREE.BufferGeometry[] {
  const { start, end, hasEnd } = track;
  const tail = hasEnd ? end - STAKE_GAP : end;
  const body = hasEnd
    ? [
        ...rope(track, start - RING_RADIUS, end + BUTTON_RADIUS),
        placed('careerButton', { ...track, z: end }),
        ...rope(track, end - BUTTON_RADIUS, tail),
      ]
    : rope(track, start - RING_RADIUS, tail);
  return [placed('careerRing', { ...track, z: start }), ...body, placed('careerStake', { ...track, z: tail })];
}

function dyed(geometries: THREE.BufferGeometry[], dye: number | undefined): THREE.BufferGeometry[] {
  if (dye === undefined) return geometries;
  const repaint = new Map([[DYE_SLOT, dye]]);
  for (const geometry of geometries) repaintSlots(geometry, repaint);
  return geometries;
}

function careerTrack(line: THREE.Object3D): CareerTrack {
  const { x, y, z } = line.position;
  const size = Number.parseFloat(String(line.userData.size));
  return { x, y, start: z, end: z - size, hasEnd: Boolean(line.userData.hasEnd) };
}

function timelineGeometries(model: THREE.Object3D): THREE.BufferGeometry[] {
  const timeline = model.getObjectByName(TIMELINE);
  if (!(timeline instanceof THREE.Mesh)) throw new Error('커리어 주 타임라인 선을 찾지 못했어요.');
  timeline.geometry.computeBoundingBox();
  const box = timeline.geometry.boundingBox?.clone().translate(timeline.position);
  if (!box) throw new Error('커리어 주 타임라인 선의 범위를 구하지 못했어요.');
  const lane = { x: box.getCenter(new THREE.Vector3()).x, y: timeline.position.y };
  return tiedRope(lane, box.max.z - STAKE_GAP, box.min.z + STAKE_GAP);
}

function carveMarker(line: THREE.Object3D, dye: number | undefined): void {
  const stone = line.children.find((child) => STONE.test(child.name));
  const post = stone?.children.find((child) => STONE_POST.test(child.name));
  if (!(post instanceof THREE.Mesh)) throw new Error(`${line.name}의 돌기둥을 찾지 못했어요.`);
  post.geometry.dispose();
  [post.geometry] = dyed([islandModelGeometry('careerMarker')], dye);
  post.material = islandPaletteMaterial('careerMarker');
}

function careerLineRopes(line: THREE.Object3D): THREE.BufferGeometry[] {
  const dye = DYES.get(line.userData.color);
  carveMarker(line, dye);
  return dyed(careerLineGeometries(careerTrack(line)), dye);
}

export function tieCareerRopes(model: THREE.Object3D): void {
  const lines = model.children.filter((child) => LINE.test(child.name));
  const merged = mergeGeometries([...timelineGeometries(model), ...lines.flatMap(careerLineRopes)]);
  if (!merged) throw new Error('커리어 밧줄 형상을 합치지 못했어요.');
  for (const name of OLD_TRACKS) model.getObjectByName(name)?.removeFromParent();
  const ropes = new THREE.Mesh(merged, islandPaletteMaterial('careerRope'));
  ropes.name = 'careerRopes';
  model.add(ropes);
}
