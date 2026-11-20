import { color, mix, normalWorld } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import {
  addCabin,
  addFenders,
  addFront,
  addRear,
  createPartsBuilder,
  shadedMaterial,
  wheelAssembly,
} from '@views/drive/lib/engine/game/world/boxyVehicleParts';

type Triple = readonly [number, number, number];
export type PartName =
  | 'bodyPainted'
  | 'trim'
  | 'metal'
  | 'glass'
  | 'headlights'
  | 'amber'
  | 'redLens'
  | 'blinkerLeft'
  | 'blinkerRight'
  | 'stopLights'
  | 'backLights';

interface BoxOptions {
  radius?: number;
  rotation?: Triple;
}

export interface VehicleParts {
  add: (name: PartName, geometry: THREE.BufferGeometry, position: Triple, rotation?: Triple) => void;
  box: (name: PartName, size: Triple, position: Triple, options?: BoxOptions) => void;
  cylinder: (name: PartName, radius: number, depth: number, position: Triple) => void;
  ring: (name: PartName, radius: number, tube: number, position: Triple) => void;
  build: (materials: Record<PartName, THREE.Material>) => THREE.Group;
}

interface BoxyVehicle {
  model: THREE.Group;
  dispose: () => void;
}

export function createBoxyVehicle(original: THREE.Object3D): BoxyVehicle {
  const game = getGame();
  const wheels = wheelAssembly(original);
  const parts = createPartsBuilder();
  parts.box('bodyPainted', [2.62, 0.26, 1.4], [0.025, -0.035, 0], { radius: 0.025 });
  parts.box('bodyPainted', [0.88, 0.37, 1.39], [-0.03, -0.25, 0], { radius: 0.02 });
  parts.box('trim', [2.45, 0.13, 0.99], [0, -0.49, 0], { radius: 0.025 });
  addCabin(parts);
  addFenders(parts);
  addFront(parts);
  addRear(parts);

  const glass = new MeshDefaultMaterial({
    colorNode: mix(color('#152b3d'), color('#4b7182'), normalWorld.y.abs().mul(0.4)).rgb,
  });
  glass.userData.prevent = true;
  const headlight = game.materials.emissiveGradient('islandHeadlight', {
    inner: '#fff9e8',
    outer: '#b9d9de',
    intensity: 1.6,
    isNormalized: false,
  });
  headlight.userData.prevent = true;
  const blink = new THREE.MeshBasicMaterial({ name: 'emissiveOrangeRadialGradient' });
  const chassis = parts.build({
    bodyPainted: new THREE.MeshBasicMaterial({ name: 'redGradient' }),
    trim: shadedMaterial('#262b31'),
    metal: shadedMaterial('#9aa8ae'),
    glass,
    headlights: headlight,
    amber: shadedMaterial('#ea9c32'),
    redLens: shadedMaterial('#9f2433'),
    blinkerLeft: blink,
    blinkerRight: blink,
    stopLights: blink,
    backLights: blink,
  });

  const meshes = chassis.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh);
  const geometries = meshes.map((mesh) => mesh.geometry);
  const materials = new Set(
    meshes
      .map((mesh) => mesh.material)
      .filter((material): material is THREE.Material => material instanceof THREE.Material && material !== headlight),
  );
  const model = new THREE.Group();
  model.name = 'islandBoxySUV';
  model.add(chassis, wheels);
  return {
    model,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
