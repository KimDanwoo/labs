import * as THREE from 'three';
import { childFacing } from './atlas';
import { advanceMotion, createMotion } from './motion';

/** Authored 4-direction artwork with idle, six walk poses and an airborne pose. Identity never morphs when turning. */
export function createChild(atlas: THREE.Texture) {
  const group = new THREE.Group();
  atlas.repeat.set(1 / 8, 1 / 4);
  atlas.offset.set(0, 3 / 4);
  const material = new THREE.SpriteMaterial({ map: atlas, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 12 / 512);
  sprite.scale.set(7.8, 10.4, 1);
  group.add(sprite);
  const motion = createMotion();
  let facing = 0;
  let time = 0;
  let frame = -1;
  return {
    group,
    update(
      dt: number,
      travel: number,
      heading: number,
      walking: boolean,
      running: boolean,
      reducedMotion: boolean,
      jumpHeight = 0,
      jumpVelocity = 0,
      landing = 0,
    ) {
      time += dt;
      const m = advanceMotion(motion, dt, travel, heading, running, walking);
      // Discrete artwork must follow the requested direction immediately. Smoothing
      // a 180-degree turn displays unrelated side frames while walking backwards.
      facing = childFacing(facing, heading);
      const column =
        jumpHeight > 0 ? 7 : !walking || reducedMotion ? 0 : 1 + (Math.floor((m.phase / (Math.PI * 2)) * 6) % 6);
      const nextFrame = facing * 8 + column;
      if (frame !== nextFrame) {
        atlas.offset.set(column / 8, (3 - facing) / 4);
        frame = nextFrame;
      }
      // The drawings carry the gait. Only subtle whole-body secondary motion is added.
      material.rotation = reducedMotion ? 0 : -Math.sin((facing * Math.PI) / 2) * m.run * m.energy * 0.045;
      const squash = reducedMotion ? 0 : landing * 0.045;
      sprite.scale.set(7.8 * (1 + squash * 0.4), 10.4 * (1 - squash), 1);
      sprite.position.y = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.015 * (1 - m.energy);
      void jumpVelocity;
    },
    dispose() {
      material.dispose();
    },
  };
}
