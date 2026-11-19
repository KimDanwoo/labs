import type { RigidBody } from '@dimforge/rapier3d-compat';
import type * as THREE from 'three/webgpu';

import { objectOf, type WorldObject } from '../../objectColliders';
import type { Area } from './area';
import { type Checkpoint, type Podium, RACE_DAY, RACE_WEATHER, requireBody } from './circuitConfig';
import { createPodium, createRails } from './circuitSetup';
import { bindMenu, type MenuHandlers } from './circuitUi';

interface Pose {
  readonly position: THREE.Vector3;
  readonly rotation: number;
}

export interface RaceWorld {
  readonly start: Pose;
  readonly roadBody: RigidBody;
  readonly rails: WorldObject;
  readonly podium: Podium;
  readonly racingButtons: HTMLElement;
}

export function createRaceWorld(area: Area, menu: MenuHandlers): RaceWorld {
  const start = area.requireReference('start');
  const roadBody = requireBody(objectOf(area.requireReference('road')));
  roadBody.setEnabled(false);
  return {
    start: { position: start.position.clone(), rotation: start.rotation.y },
    roadBody,
    rails: createRails(area),
    podium: createPodium(area),
    racingButtons: bindMenu(area, menu),
  };
}

export function enterRaceWorld(game: Area['game'], race: RaceWorld): void {
  const { physicalVehicle, world, weather, dayCycles, objects } = game;
  race.racingButtons.classList.add('is-active');
  physicalVehicle.moveTo(race.start.position, race.start.rotation);
  world.floor?.physical.body.setEnabled(false);
  race.roadBody.setEnabled(true);
  world.explosiveCrates?.reset();
  weather.override.start(RACE_WEATHER, 0);
  dayCycles.override.start(RACE_DAY, 0);
  objects.enable(race.rails);
  objects.disable(race.podium.object);
}

export function leaveRaceWorld(game: Area['game'], race: RaceWorld): void {
  const { inputs, respawns, physicalVehicle, world, weather, dayCycles, objects } = game;
  race.racingButtons.classList.remove('is-active');
  inputs.filters.clear();
  inputs.filters.add('wandering');
  const respawn = respawns.getByName('circuit');
  physicalVehicle.moveTo(respawn.position, respawn.rotation);
  world.floor?.physical.body.setEnabled(true);
  race.roadBody.setEnabled(false);
  weather.override.end(0);
  dayCycles.override.end(0);
  objects.disable(race.rails);
  world.explosiveCrates?.reset();
}

export function respawnPose(last: Checkpoint | null, start: Pose): Pose {
  if (!last) return { position: start.position.clone(), rotation: start.rotation };
  return { position: last.respawnPosition.clone(), rotation: last.rotation + Math.PI * 0.5 };
}
