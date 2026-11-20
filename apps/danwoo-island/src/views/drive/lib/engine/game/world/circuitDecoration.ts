import * as THREE from 'three/webgpu';

import { byeotgari } from '@views/drive/lib/engine/game/world/byeotgari';
import {
  type DecorationKind,
  CIRCUIT_DECORATION,
  START_LIGHT_FRAME_LIFT,
} from '@views/drive/lib/engine/game/world/circuitDecorationConfig';
import { hongsalmun } from '@views/drive/lib/engine/game/world/circuitGates';
import { bannerStand, dancerChest, tentPole } from '@views/drive/lib/engine/game/world/circuitStands';
import { createParts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import { type MeshComponent, removeComponents } from '@views/drive/lib/engine/game/world/meshComponents';

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
  const isErasable = isProp || isMarking || isGantryPaint;
  if (isErasable) return 'erase';
  const isThinPole = size.x < design.legMaxWidth && size.z < design.legMaxWidth && size.y > design.legMinHeight;
  const isTentLeg = design.tents.containsPoint(center) && isThinPole;
  if (isTentLeg) return 'tentLeg';
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
