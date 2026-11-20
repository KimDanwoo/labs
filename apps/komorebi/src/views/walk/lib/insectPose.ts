import { FLIGHT } from '@views/walk/lib/flight';
import { characterScale, sceneX, sceneY } from '@views/walk/lib/perspective';
import { ALTITUDE, ATLAS, INSECT, LANDING_EASE, type Life } from '@views/walk/lib/sceneLifeData';
import * as THREE from 'three';

export function drawInsect(life: Life, elapsed: number, dt: number) {
  const { flight, kind, sprite: s, material, size } = life;
  const isSettled = flight.mode === FLIGHT.rest;
  const depth = characterScale(flight.z) * 2.4 * size;
  const [flying, settled] = ALTITUDE[kind];
  life.lift = THREE.MathUtils.damp(life.lift, isSettled ? settled : flying, LANDING_EASE, dt);
  life.aloft = THREE.MathUtils.damp(life.aloft, isSettled ? 0 : 1, LANDING_EASE, dt);
  const bob = life.aloft * (Math.sin(elapsed * 3.1 + life.bob) * 0.5 + Math.sin(elapsed * 7.3 + life.bob) * 0.2);
  s.position.set(sceneX(flight.x), sceneY(flight.z) + life.lift + bob, 1);
  if (kind === INSECT.butterfly) {
    s.scale.set(depth * ATLAS.butterfly.aspect * (0.2 + 0.8 * Math.abs(Math.cos(flight.wing))), depth, 1);
    material.rotation = isSettled ? 0 : Math.sin(elapsed * 2 + life.bob) * 0.25;
    return;
  }
  const screenAngle = Math.atan2(-Math.sin(flight.heading) * 0.8, Math.cos(flight.heading) * 1.2);
  material.rotation = screenAngle - Math.PI / 2;
  s.scale.set(depth * ATLAS.dragonfly.aspect * (0.88 + 0.12 * Math.abs(Math.sin(flight.wing))), depth, 1);
}
