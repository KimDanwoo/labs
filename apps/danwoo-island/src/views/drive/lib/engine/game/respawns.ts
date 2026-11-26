import * as THREE from 'three/webgpu';

import {
  RESPAWN_POINTS,
  type RespawnPoint,
  respawnPosition,
} from '@views/drive/lib/engine/game/world/layout/islandLayout';

interface Respawn {
  name: string;
  position: THREE.Vector3;
  rotation: number;
}

const SPAWN_HEIGHT = 4;

function placedRespawn(name: string, point: RespawnPoint): Respawn {
  const [x, z] = respawnPosition(point);
  return { name, position: new THREE.Vector3(x, SPAWN_HEIGHT, z), rotation: point.rotation };
}

export class Respawns {
  readonly #items = new Map<string, Respawn>();
  readonly #defaultName: string;

  constructor(defaultName = 'landing') {
    this.#defaultName = defaultName;
    for (const [name, point] of Object.entries(RESPAWN_POINTS)) this.#items.set(name, placedRespawn(name, point));
  }

  getByName(name: string): Respawn {
    const respawn = this.#items.get(name);
    if (!respawn) throw new Error(`Unknown respawn ${name}`);
    return respawn;
  }

  getDefault(): Respawn {
    return this.getByName(this.#defaultName);
  }

  getClosest(position: THREE.Vector3, options: { isLighthouseAccessible: boolean }): Respawn {
    const distanceTo = (respawn: Respawn): number =>
      Math.hypot(respawn.position.x - position.x, respawn.position.z - position.z);
    const isCloserThan = (respawn: Respawn, best: Respawn | null): boolean =>
      best === null || distanceTo(respawn) < distanceTo(best);
    const closest = [...this.#items.values()]
      .filter((item) => item.name !== 'lighthouse' || options.isLighthouseAccessible)
      .reduce<Respawn | null>((best, respawn) => (isCloserThan(respawn, best) ? respawn : best), null);
    if (!closest) throw new Error('No respawns loaded');
    return closest;
  }
}
