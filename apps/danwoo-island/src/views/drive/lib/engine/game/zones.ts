import * as THREE from 'three/webgpu';

import { Events } from './events';
import { getGame } from './gameContext';

export type ZoneShape = 'sphere' | 'cylinder';

export interface Zone {
  type: ZoneShape;
  position: THREE.Vector3;
  radius: number;
  isIn: boolean;
  events: Events<{ enter: [Zone]; leave: [Zone] }>;
}

const TICK_ORDER = 8;

const flatten = (point: THREE.Vector3): THREE.Vector2 => new THREE.Vector2(point.x, point.z);

function distanceToZone(player: THREE.Vector3, zone: Zone): number {
  if (zone.type === 'cylinder') return flatten(player).distanceTo(flatten(zone.position));
  return player.distanceTo(zone.position);
}

export class Zones {
  readonly game = getGame();
  readonly #items: Zone[] = [];

  constructor() {
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  create(type: ZoneShape, position: THREE.Vector3, radius: number): Zone {
    const zone: Zone = { type, position, radius, isIn: false, events: new Events() };
    this.#items.push(zone);
    return zone;
  }

  update(): void {
    for (const zone of this.#items) {
      const isIn = distanceToZone(this.game.player.position, zone) < zone.radius;
      if (isIn === zone.isIn) continue;
      zone.isIn = isIn;
      zone.events.trigger(isIn ? 'enter' : 'leave', zone);
    }
  }
}
