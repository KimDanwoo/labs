import type { RigidBody } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { objectOf } from '../../objects';
import { rebuildOuthouse } from '../islandStructures';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';

const FALLEN_UP_THRESHOLD = 0.4;
const UP = new THREE.Vector3(0, 1, 0);

export class ToiletArea extends Area {
  readonly cabin: { body: RigidBody; down: boolean };

  constructor(model: THREE.Object3D) {
    super(model);
    const physical = objectOf(this.requireReference('cabin')).physical;
    if (!physical) throw new Error('Toilet cabin has no physical body');
    this.cabin = { body: physical.body, down: false };

    const moon = this.requireReference('moon');
    moon.visible = this.game.dayCycles.isInInterval('night');
    this.game.dayCycles.events.on('night', (isNight) => {
      moon.visible = isNight;
    });
  }

  override setObjects(): void {
    rebuildOuthouse(this.model, this.game.materials);
    rebuildVillageProps(this.model, this.game.materials);
    super.setObjects();
  }

  override update(): void {
    const { cabin } = this;
    if (cabin.down || cabin.body.isSleeping()) return;
    if (UP.clone().applyQuaternion(cabin.body.rotation()).y < FALLEN_UP_THRESHOLD) cabin.down = true;
  }

  refreshAfterReset(): void {
    this.cabin.down = false;
  }
}
