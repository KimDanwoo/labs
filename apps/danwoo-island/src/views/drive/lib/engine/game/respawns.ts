import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import { placedInArea } from './world/layout/areaPlacement';
import { RESPAWN_AREAS } from './world/layout/islandLayout';

export interface Respawn {
  name: string;
  position: THREE.Vector3;
  rotation: number;
}

const SPAWN_HEIGHT = 4;
const RESPAWN_PREFIX = /^respawn(.+)$/i;
const EXTRA_RESPAWNS = [
  { name: 'beachStart', x: 54.6, z: 41.6, rotation: -1.15 },
  { name: 'timeMachine', x: -58.5, z: -69.6, rotation: 0 },
] as const;

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

function placedRespawn(name: string, x: number, z: number): THREE.Vector3 {
  const area = RESPAWN_AREAS[name];
  if (!area) throw new Error(`리스폰 ${name}이 어느 구역에 속하는지 정해지지 않았어요.`);
  return placedInArea(area, new THREE.Vector3(x, SPAWN_HEIGHT, z));
}

export class Respawns {
  readonly game = getGame();
  readonly #items = new Map<string, Respawn>();
  readonly #defaultName: string;

  constructor(defaultName = 'landing') {
    this.#defaultName = defaultName;
    for (const child of this.game.model('respawnsReferencesModel').scene.children) {
      child.rotation.reorder('YXZ');
      const name = lowerFirst(child.name.replace(RESPAWN_PREFIX, '$1'));
      this.#items.set(name, {
        name,
        position: placedRespawn(name, child.position.x, child.position.z),
        rotation: child.rotation.y,
      });
    }
    for (const { name, x, z, rotation } of EXTRA_RESPAWNS) {
      this.#items.set(name, { name, position: placedRespawn(name, x, z), rotation });
    }
  }

  getByName(name: string): Respawn {
    const respawn = this.#items.get(name);
    if (!respawn) throw new Error(`Unknown respawn ${name}`);
    return respawn;
  }

  getDefault(): Respawn {
    return this.getByName(this.#defaultName);
  }

  getClosest(position: THREE.Vector3): Respawn {
    const distanceTo = (respawn: Respawn): number =>
      Math.hypot(respawn.position.x - position.x, respawn.position.z - position.z);
    const closest = [...this.#items.values()].reduce<Respawn | null>(
      (best, respawn) => (!best || distanceTo(respawn) < distanceTo(best) ? respawn : best),
      null,
    );
    if (!closest) throw new Error('No respawns loaded');
    return closest;
  }
}
