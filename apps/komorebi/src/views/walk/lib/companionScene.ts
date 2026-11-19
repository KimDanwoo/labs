import type * as THREE from 'three';
import { REGION, type Region } from '../model/world/world';
import { catPosition, createCatScene } from './catScene';
import { createPartKit } from './companionParts';
import { COMPANION_REACTION, FISH_HOME, type CompanionReaction, type Companions } from './companions';
import type { FishingFrame } from './fishing';
import { createTankScene } from './tankScene';

export { catPosition };

export function createCompanionScene(scene: THREE.Scene, loader?: THREE.TextureLoader) {
  const kit = createPartKit();
  const { part } = kit;
  const tankScene = createTankScene(scene, loader, kit);
  const catScene = createCatScene(scene, loader, kit);
  const { tank } = tankScene;
  const { cat } = catScene;
  const heartGeometry = kit.createHeartGeometry();
  const catHeart = part(cat, heartGeometry, 0xe8919c, 0, 4.4, 0.5, 0.5, 6);
  const tankHeart = part(tank, heartGeometry, 0xe8919c, 0, 8.5, 0.5, 0.5, 6);
  let reaction: CompanionReaction | null = null;
  let reactionAge = 10;
  return {
    react(next: CompanionReaction) {
      reaction = next;
      reactionAge = 0;
    },
    update(
      dt: number,
      elapsed: number,
      region: Region,
      state: Companions,
      fishing: FishingFrame | null,
      fishingAge: number,
      reducedMotion: boolean,
    ) {
      reactionAge += Math.max(0, dt);
      tank.visible = region === REGION.home;
      cat.visible = region === REGION.coast;
      const feed = reaction === COMPANION_REACTION.feed && reactionAge < 3;
      const kept = state.fish.filter((fish) => fish.home === FISH_HOME.tank);
      tankScene.update(tankHeart, { elapsed, reducedMotion, feed, reactionAge, kept });
      catScene.update(catHeart, { dt, elapsed, state, fishing, fishingAge, reducedMotion, reaction, reactionAge });
    },
    dispose() {
      catScene.dispose();
      tankScene.dispose();
      scene.remove(cat, tank);
      kit.dispose();
    },
  };
}
