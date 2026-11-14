import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';

export interface Respawn {
  name: string;
  position: THREE.Vector3;
  rotation: number;
}

const SPAWN_HEIGHT = 4;
const RESPAWN_PREFIX = /^respawn(.+)$/i;

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

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
        position: new THREE.Vector3(child.position.x, SPAWN_HEIGHT, child.position.z),
        rotation: child.rotation.y,
      });
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
