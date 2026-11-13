import * as THREE from 'three';
import type { BallGame, BallRole } from '../model/ballGame';
import { ballPose } from '../model/ballMotion';
import { CHARACTER_RIG, type BodyPoseOffsets } from '../model/world/appearance';
import { childFacing } from './atlas';
import { FISHING_PHASE, type FishingFrame } from './fishing';
import { advanceMotion, createMotion, crossedFootfall } from './motion';
import { lightSprite } from './nightLights';

export type ChildLayers = { body: THREE.Texture; outfit: THREE.Texture; bodyPoseOffsets?: BodyPoseOffsets };
type ChildFrame = {
  dt: number;
  travel: number;
  heading: number;
  isWalking: boolean;
  isRunning: boolean;
  isStill: boolean;
  jumpHeight?: number;
  landing?: number;
};
type CompanionPose = { age: number; isStill: boolean };
type FishingPose = { frame: FishingFrame | null; elapsed: number; isStill: boolean };
type BallPose = { game: BallGame | null; role: BallRole; heading: number; isStill: boolean };
type ChildCharacter = {
  group: THREE.Group;
  setOutfit: (next: THREE.Texture) => void;
  setOpacity: (value: number) => void;
  update: (frame: ChildFrame) => { hasStepped: boolean };
  setCompanionPose: (pose: CompanionPose) => void;
  setFishingPose: (pose: FishingPose) => void;
  setBallPose: (pose: BallPose) => void;
  setLight: (darkness: number, glow: number) => void;
  dispose: () => void;
};

/** Body and costume share a pose grid; changing clothes never replaces the character or resets their gait. */
export function createChild(initialLayers: ChildLayers): ChildCharacter {
  const layers = { body: initialLayers.body, outfit: initialLayers.outfit };
  const bodyPoseOffsets = initialLayers.bodyPoseOffsets ?? {};
  const group = new THREE.Group();
  const bodyMaterial = new THREE.SpriteMaterial({ map: layers.body, depthWrite: false });
  const outfitMaterial = new THREE.SpriteMaterial({ map: layers.outfit, depthWrite: false });
  const materials = [outfitMaterial, bodyMaterial];
  const sprites = materials.map((material) => {
    const sprite = new THREE.Sprite(material);
    sprite.center.set(0.5, CHARACTER_RIG.footInset / (CHARACTER_RIG.height / CHARACTER_RIG.rows));
    sprite.scale.set(7.8, 10.4, 1);
    group.add(sprite);
    return sprite;
  });
  Object.values(layers).forEach((atlas) => {
    atlas.repeat.set(1 / CHARACTER_RIG.columns, 1 / CHARACTER_RIG.rows);
    atlas.offset.set(0, (CHARACTER_RIG.rows - 1) / CHARACTER_RIG.rows);
  });
  const motion = createMotion();
  let facing = 0;
  let time = 0;
  let frame = -1;
  return {
    group,
    setOutfit(next: THREE.Texture) {
      layers.outfit = next;
      next.repeat.copy(layers.body.repeat);
      next.offset.copy(layers.body.offset);
      outfitMaterial.map = next;
      outfitMaterial.needsUpdate = true;
    },
    setOpacity(value: number) {
      materials.forEach((material) => {
        material.opacity = value;
      });
      sprites.forEach((sprite) => {
        sprite.visible = value > 0.001;
      });
    },
    update({
      dt,
      travel,
      heading,
      isWalking: walking,
      isRunning: running,
      isStill: reducedMotion,
      jumpHeight = 0,
      landing = 0,
    }: ChildFrame) {
      time += dt;
      const previousPhase = motion.phase;
      const m = advanceMotion(motion, dt, travel, heading, running, walking);
      // Discrete artwork must follow the requested direction immediately. Smoothing
      // a 180-degree turn displays unrelated side frames while walking backwards.
      facing = childFacing(facing, heading);
      const column = atlasColumn(jumpHeight > 0, walking && !reducedMotion, m.phase);
      const nextFrame = facing * CHARACTER_RIG.columns + column;
      if (frame !== nextFrame) {
        Object.values(layers).forEach((atlas) =>
          atlas.offset.set(column / CHARACTER_RIG.columns, (CHARACTER_RIG.rows - 1 - facing) / CHARACTER_RIG.rows),
        );
        sprites.forEach((sprite) => {
          if (sprite.material !== bodyMaterial) return;
          sprite.center.y =
            (CHARACTER_RIG.footInset + (bodyPoseOffsets[nextFrame] ?? 0)) / (CHARACTER_RIG.height / CHARACTER_RIG.rows);
        });
        frame = nextFrame;
      }
      // The drawings carry the gait. Only subtle whole-body secondary motion is added.
      materials.forEach((material) => {
        material.rotation = reducedMotion ? 0 : -Math.sin((facing * Math.PI) / 2) * m.run * m.energy * 0.045;
      });
      const squash = reducedMotion ? 0 : landing * 0.045;
      sprites.forEach((sprite) => {
        sprite.scale.set(7.8 * (1 + squash * 0.4), 10.4 * (1 - squash), 1);
        sprite.position.y = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.015 * (1 - m.energy);
      });
      return { hasStepped: walking && jumpHeight <= 0 && crossedFootfall(previousPhase, m.phase) };
    },
    setCompanionPose({ age, isStill: reducedMotion }: CompanionPose) {
      if (reducedMotion || age >= 2.4) return;
      const lean = Math.sin(Math.min(1, age / 2.4) * Math.PI) * 0.09;
      materials.forEach((material) => {
        material.rotation = lean;
      });
      sprites.forEach((sprite) => sprite.scale.set(7.8, 10.4 * (1 - lean * 0.5), 1));
    },
    setFishingPose({ frame, elapsed, isStill: reducedMotion }: FishingPose) {
      if (!frame || reducedMotion) return;
      const isFighting = frame.phase === FISHING_PHASE.fighting;
      const isCasting = frame.phase === FISHING_PHASE.casting;
      let lean = 0.015;
      if (isCasting) lean = Math.sin(elapsed * 7) * 0.08;
      if (isFighting) lean = (frame.isReeling ? 0.1 : 0.025) * (0.5 + frame.tension / 100);
      if (frame.phase === FISHING_PHASE.caught) lean = elapsed < 1.5 ? Math.sin(elapsed * 10) * 0.045 : 0;
      materials.forEach((material) => {
        material.rotation = lean;
      });
      sprites.forEach((sprite) => {
        sprite.scale.set(7.8, 10.4 * (1 - Math.abs(lean) * 0.2), 1);
        sprite.position.y = isFighting && frame.isReeling ? Math.sin(elapsed * 14) * 0.06 : 0;
      });
    },
    setBallPose(pose) {
      const { lean, compression } = ballPose(pose);
      materials.forEach((material) => {
        material.rotation += lean * Math.sin(pose.heading);
      });
      sprites.forEach((sprite) => {
        sprite.scale.y *= compression;
      });
    },
    /** Moonlight on the sprite, so the child sits in the night painting rather than on top of it. */
    /** Moonlit after dark, warmed by `glow` (0–0.9) where lamplight falls on the child. */
    setLight(darkness: number, glow: number) {
      materials.forEach((material) => lightSprite(material.color, darkness, glow));
    },
    dispose() {
      materials.forEach((material) => material.dispose());
    },
  };
}

const AIR_COLUMN = 7;
const STAND_COLUMN = 0;
const WALK_FRAMES = 6;

function atlasColumn(isAirborne: boolean, isStepping: boolean, phase: number) {
  if (isAirborne) return AIR_COLUMN;
  if (!isStepping) return STAND_COLUMN;
  return 1 + (Math.floor((phase / (Math.PI * 2)) * WALK_FRAMES) % WALK_FRAMES);
}
