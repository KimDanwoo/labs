import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { Physical } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { remapClamp } from '@views/drive/lib/engine/game/utilities/maths';

interface ExplosionOptions {
  radius?: number;
  strength?: number;
  isVehicleOnly?: boolean;
  bulletTimeThreshold?: number;
}

const DEFAULTS = { radius: 7, strength: 4, bulletTimeThreshold: 3 } as const;
const ROLL_KICK_RANGE = [2, 15] as const;
const IMPULSE_HORIZONTAL = 0.5;

export class Explosions {
  explode(coordinates: THREE.Vector3, options: ExplosionOptions = {}): boolean {
    const game = getGame();
    const distance = game.view.focusPoint.position.distanceTo(coordinates);
    game.view.roll.kick(remapClamp(distance, [...ROLL_KICK_RANGE], [1, 0]));

    const vehicle = game.physicalVehicle.chassis.physical;
    if (options.isVehicleOnly) return this.#push(vehicle, coordinates, options);

    let isVehicleHit = false;
    for (const { physical } of game.objects.list.values()) {
      if (!physical || physical.type !== 'dynamic' || !physical.body.isEnabled()) continue;
      if (this.#push(physical, coordinates, options)) isVehicleHit = true;
    }
    return isVehicleHit;
  }

  #push(physical: Physical, coordinates: THREE.Vector3, options: ExplosionOptions): boolean {
    const game = getGame();
    const radius = options.radius ?? DEFAULTS.radius;
    const position = new THREE.Vector3().copy(physical.body.translation());
    const direction = position.clone().sub(coordinates);
    direction.y = 0;
    const fadedStrength = remapClamp(Math.hypot(direction.x, direction.z), [1, radius], [1, 0]);
    if (fadedStrength <= 0) return false;

    const finalStrength = fadedStrength * (options.strength ?? DEFAULTS.strength);
    const impulse = direction.clone().setLength(IMPULSE_HORIZONTAL);
    impulse.y = 1;
    impulse.normalize().setLength(finalStrength * physical.body.mass());
    game.ticker.wait(1, () => physical.body.applyImpulseAtPoint(impulse, position, true));

    const isVehicle = physical === game.physicalVehicle.chassis.physical;
    const threshold = options.bulletTimeThreshold ?? DEFAULTS.bulletTimeThreshold;
    if (!isVehicle || finalStrength <= threshold) return false;
    game.time.bulletTime.activate();
    return true;
  }
}
