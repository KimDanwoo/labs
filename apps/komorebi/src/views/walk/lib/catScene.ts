import { catchCelebration } from '@views/walk/lib/catchCelebration';
import type { PartKit } from '@views/walk/lib/companionParts';
import { COMPANION_REACTION, catBond, type CompanionReaction, type Companions } from '@views/walk/lib/companions';
import { FISHING_PHASE, type FishingFrame } from '@views/walk/lib/fishing';
import { CHILD_SIZE, characterScale, sceneX, sceneY } from '@views/walk/lib/perspective';
import { FISHING_PIER, PIER_CAT } from '@views/walk/model/world/landmarks';
import type { Point } from '@views/walk/model/world/world';
import * as THREE from 'three';

export function catPosition(friendship: number, isFishing: boolean): Point {
  if (!isFishing) return { x: PIER_CAT.x - 2, z: PIER_CAT.z };
  const distance = [4, 2.5, 1.5][catBond(friendship).level]!;
  return { x: FISHING_PIER.x - distance, z: FISHING_PIER.z + 0.5 };
}

export type CatFrame = {
  dt: number;
  elapsed: number;
  state: Companions;
  fishing: FishingFrame | null;
  fishingAge: number;
  reducedMotion: boolean;
  reaction: CompanionReaction | null;
  reactionAge: number;
};

function isCatSuccess(fishing: FishingFrame | null, fishingAge: number, friendship: number) {
  return fishing?.phase === FISHING_PHASE.caught && fishingAge < 2.4 && catBond(friendship).level === 2;
}

function catJump(isSuccess: boolean, fishingAge: number, reducedMotion: boolean) {
  return isSuccess ? catchCelebration(fishingAge, reducedMotion).childLift * 0.7 : 0;
}

function catWobble(isAffectionate: boolean, reducedMotion: boolean, reactionAge: number) {
  return isAffectionate && !reducedMotion ? Math.sin(reactionAge * 5) * 0.09 : 0;
}

function setCatWalkFrame(texture: THREE.Texture, isLeft: boolean, frame: number) {
  texture.repeat.x = (isLeft ? -1 : 1) / 4;
  texture.offset.x = (frame + Number(isLeft)) / 4;
}

function updateCatHeart(
  heart: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
  isActive: boolean,
  age: number,
  reducedMotion: boolean,
) {
  heart.visible = isActive && age < 2.4;
  heart.position.y = 4.2 + (reducedMotion ? 0 : age * 0.7);
  heart.material.opacity = Math.max(0, Math.sin((age / 2.4) * Math.PI));
}

export function createCatScene(
  scene: THREE.Scene,
  loader: THREE.TextureLoader | undefined,
  { circle, triangle, part }: PartKit,
) {
  const cat = new THREE.Group();
  cat.name = 'pier-companion-cat';
  scene.add(cat);
  const fallback = new THREE.Group();
  cat.add(fallback);
  part(fallback, circle, 0xd5b68c, 0, 1, 1.6, 0.8, 4.2);
  part(fallback, circle, 0xeee0c6, 1, 1.8, 0.8, 0.8, 4.2);
  part(fallback, triangle, 0x71513e, 0.55, 2.45, 0.42, 0.5, 4.2).rotation.z = Math.PI / 2;
  part(fallback, triangle, 0x71513e, 1.45, 2.45, 0.42, 0.5, 4.2).rotation.z = Math.PI / 2;
  part(fallback, circle, 0x394136, 1.3, 1.9, 0.09, 0.09, 4.3);
  const spriteMaterial = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.center.set(0.5, 0.04);
  sprite.scale.set((3.6 * 198) / 160, 3.6, 1);
  sprite.renderOrder = 4.2;
  sprite.visible = false;
  cat.add(sprite);
  let texture: THREE.Texture | null = null;
  let disposed = false;
  if (loader)
    void loader
      .loadAsync('/art/cat-walk.webp')
      .then((loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }
        texture = loaded;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.repeat.set(0.25, 1);
        spriteMaterial.map = loaded;
        spriteMaterial.needsUpdate = true;
        sprite.visible = true;
        fallback.visible = false;
      })
      .catch(() => undefined);
  const position = { x: PIER_CAT.x, z: PIER_CAT.z };

  function update(
    catHeart: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
    { dt, elapsed, state, fishing, fishingAge, reducedMotion, reaction, reactionAge }: CatFrame,
  ) {
    const target = catPosition(state.friendship, fishing !== null);
    const before = position.x;
    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 2);
    position.x += (target.x - position.x) * ease;
    position.z += (target.z - position.z) * ease;
    const moving = Math.hypot(target.x - position.x, target.z - position.z) > 0.05;
    const scale = characterScale(position.z) * CHILD_SIZE;
    const success = isCatSuccess(fishing, fishingAge, state.friendship);
    const jump = catJump(success, fishingAge, reducedMotion);
    cat.position.set(sceneX(position.x), sceneY(position.z) + jump * scale, 2);
    cat.scale.setScalar(scale);
    if (texture) {
      const left = moving && position.x < before;
      const frame = moving && !reducedMotion ? Math.floor(elapsed * 8) % 4 : 0;
      setCatWalkFrame(texture, left, frame);
    }
    const affection = reaction !== COMPANION_REACTION.feed && reactionAge < 2.4;
    const age = success ? fishingAge : reactionAge;
    updateCatHeart(catHeart, success || affection, age, reducedMotion);
    spriteMaterial.rotation = catWobble(affection, reducedMotion, reactionAge);
  }

  return {
    cat,
    update,
    dispose() {
      disposed = true;
      texture?.dispose();
      spriteMaterial.dispose();
    },
  };
}
