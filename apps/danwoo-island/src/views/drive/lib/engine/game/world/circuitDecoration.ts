import * as THREE from 'three/webgpu';

import { type DecorationKind, CIRCUIT_DECORATION, START_LIGHT_FRAME_LIFT } from './circuitDecorationConfig';
import { byeotgari, hongsalmun } from './circuitGates';
import { bannerStand, dancerChest, tentPole } from './circuitStands';
import { createParts } from './islandGeometry';
import { islandModelMesh } from './islandModels';
import { type MeshComponent, removeComponents } from './meshComponents';

function classifyDecoration({ box }: MeshComponent): DecorationKind {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const design = CIRCUIT_DECORATION;
  const isProp = [...design.dancerBases, ...design.bannerStands].some(
    ([x, z]) => Math.hypot(center.x - x, center.z - z) < design.propReach,
  );
  const isMarking = [design.resetLetters, design.courseBoard, design.clock, ...design.tires].some((region) =>
    region.containsPoint(center),
  );
  const isGantryPaint =
    design.gantry.containsPoint(center) && !design.startLights.containsBox(box) && box.max.y > design.groundPaintTop;
  if (isProp || isMarking || isGantryPaint) return 'erase';
  const isThinPole = size.x < design.legMaxWidth && size.z < design.legMaxWidth && size.y > design.legMinHeight;
  if (design.tents.containsPoint(center) && isThinPole) return 'tentLeg';
  return 'keep';
}

function startLightFrame(): THREE.Mesh {
  const center = CIRCUIT_DECORATION.startLights.getCenter(new THREE.Vector3());
  center.y += START_LIGHT_FRAME_LIFT;
  return islandModelMesh('startLightFrame', new THREE.Matrix4().makeTranslation(center));
}

export function reshapeCircuitDecoration(model: THREE.Object3D): void {
  const decoration = model.getObjectByName('Cube088');
  if (!(decoration instanceof THREE.Mesh)) return;
  const parts = createParts();
  const removed = removeComponents(decoration, (component) => classifyDecoration(component) !== 'keep');
  for (const component of removed) {
    if (classifyDecoration(component) === 'tentLeg') tentPole(parts, component.box);
  }
  byeotgari(parts);
  dancerChest(parts);
  bannerStand(parts);
  hongsalmun(parts);
  decoration.add(parts.build(), startLightFrame());
}
