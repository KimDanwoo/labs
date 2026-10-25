import { characterDirectionScale, type Appearance } from '@shared/world/appearance';
import * as THREE from 'three';
import { childFacing } from './atlas';
import { atlasColumn } from './childFrames';
import { advanceMotion, createMotion, crossedFootfall } from './motion';
import { lightSprite } from './nightLights';

/** Four directions: idle, four walking poses, two running contacts and a jump. */
export function createChild(initialAtlas: THREE.Texture, initialAppearance: Appearance) {
  let atlas = initialAtlas;
  let appearance = initialAppearance;
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
    setAtlas(next: THREE.Texture, nextAppearance: Appearance) {
      atlas = next;
      appearance = nextAppearance;
      atlas.repeat.set(1 / 8, 1 / 4);
      atlas.offset.set(0, (3 - facing) / 4);
      material.map = atlas;
      material.needsUpdate = true;
      frame = -1;
    },
    setOpacity(value: number) {
      material.opacity = value;
      sprite.visible = value > 0.001;
    },
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
      const previousPhase = motion.phase;
      const m = advanceMotion(motion, dt, travel, heading, running, walking);
      // Discrete artwork must follow the requested direction immediately. Smoothing
      // a 180-degree turn displays unrelated side frames while walking backwards.
      facing = childFacing(facing, heading);
      const column = atlasColumn(jumpHeight > 0 || jumpVelocity > 0, walking && !reducedMotion, m.phase, running);
      const nextFrame = facing * 8 + column;
      if (frame !== nextFrame) {
        atlas.offset.set(column / 8, (3 - facing) / 4);
        frame = nextFrame;
      }
      // The drawings carry the gait. Only subtle whole-body secondary motion is added.
      material.rotation = reducedMotion ? 0 : -Math.sin((facing * Math.PI) / 2) * m.run * m.energy * 0.045;
      const squash = reducedMotion ? 0 : landing * 0.045;
      const directionScale = characterDirectionScale(appearance, facing);
      sprite.scale.set(7.8 * directionScale * (1 + squash * 0.4), 10.4 * directionScale * (1 - squash), 1);
      sprite.position.y = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.015 * (1 - m.energy);
      return { hasStepped: walking && jumpHeight <= 0 && crossedFootfall(previousPhase, m.phase) };
    },
    /** Moonlight on the sprite, so the child sits in the night painting rather than on top of it. */
    /** Moonlit after dark, warmed by `glow` (0–0.9) where lamplight falls on the child. */
    setLight(darkness: number, glow: number) {
      lightSprite(material.color, darkness, glow);
    },
    dispose() {
      material.dispose();
    },
  };
}
