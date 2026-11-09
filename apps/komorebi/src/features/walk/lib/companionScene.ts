import { type Point, type Region, FISHING_PIER, HOME_AQUARIUM, PIER_CAT } from '@shared/world/world';
import * as THREE from 'three';
import { AQUARIUM_ART, aquariumFishArt, aquariumPose } from './aquarium';
import { catchCelebration } from './catchCelebration';
import {
  type CompanionReaction,
  type Companions,
  COMPANION_REACTION,
  FISH_HOME,
  TANK_CAPACITY,
  catBond,
} from './companions';
import { type FishingFrame, FISHING_PHASE } from './fishing';
import { CHILD_SIZE, characterScale, sceneX, sceneY } from './perspective';

/** Local, bounded movement keeps the companion on the pier, even when the child leaves. */
export function catPosition(friendship: number, isFishing: boolean): Point {
  if (!isFishing) return { x: PIER_CAT.x - 2, z: PIER_CAT.z };
  const distance = [4, 2.5, 1.5][catBond(friendship).level]!;
  return { x: FISHING_PIER.x - distance, z: FISHING_PIER.z + 0.5 };
}

export function createCompanionScene(scene: THREE.Scene, loader?: THREE.TextureLoader) {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const plane = new THREE.PlaneGeometry(1, 1);
  const circle = new THREE.CircleGeometry(1, 24);
  const triangle = new THREE.CircleGeometry(1, 3);
  geometries.push(plane, circle, triangle);
  function part(
    group: THREE.Group,
    shape: THREE.BufferGeometry,
    color: number,
    x: number,
    y: number,
    w: number,
    h: number,
    order = 3.6,
    opacity = 1,
  ) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(shape, material);
    mesh.position.set(x, y, 0);
    mesh.scale.set(w, h, 1);
    mesh.renderOrder = order;
    group.add(mesh);
    return mesh;
  }
  const tank = new THREE.Group();
  tank.name = 'home-aquarium';
  // Stand beside the aquarium rather than covering it with the child sprite.
  tank.position.set(sceneX(HOME_AQUARIUM.x + 4), sceneY(HOME_AQUARIUM.z - 3), 2);
  tank.scale.setScalar(characterScale(HOME_AQUARIUM.z) * CHILD_SIZE);
  scene.add(tank);
  const tankTextures = new Map<string, THREE.Texture>();
  let isTankDisposed = false;
  const tankArt = part(tank, plane, 0xffffff, 0, 4.667, 14, 9.333);
  tankArt.visible = false;
  const swimmers = Array.from({ length: TANK_CAPACITY }, (_, index) => {
    const group = new THREE.Group();
    group.name = `aquarium-fish-${index}`;
    const geometry = new THREE.PlaneGeometry(1, 1, 16, 2);
    geometries.push(geometry);
    const body = part(group, geometry, 0xffffff, 0, 0, 1, 1, 3.7);
    body.visible = false;
    tank.add(group);
    return { group, body };
  });
  for (const src of [
    AQUARIUM_ART,
    ...new Set(['mackerel', 'bream', 'flounder', 'grouper'].map((name) => `/art/aquarium-${name}-v2.webp`)),
  ]) {
    if (!loader) continue;
    void loader
      .loadAsync(src)
      .then((loaded) => {
        if (isTankDisposed) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        tankTextures.set(src, loaded);
        if (src === AQUARIUM_ART) {
          tankArt.material.map = loaded;
          tankArt.material.needsUpdate = true;
          tankArt.visible = true;
        }
      })
      .catch(() => undefined);
  }
  const bubbles = Array.from({ length: 6 }, (_, i) =>
    part(tank, circle, 0xf0fff5, -4.9 + i * 0.05, 5 + i * 0.3, 0.025, 0.04, 3.75, 0.4),
  );
  const pellets = Array.from({ length: 5 }, (_, i) =>
    part(tank, circle, 0x966642, (i - 2) * 0.25, 7, 0.035, 0.035, 3.8),
  );
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
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.6);
  heartShape.bezierCurveTo(-1.2, 0.2, -0.7, 1.1, 0, 0.5);
  heartShape.bezierCurveTo(0.7, 1.1, 1.2, 0.2, 0, -0.6);
  const heartGeometry = new THREE.ShapeGeometry(heartShape);
  geometries.push(heartGeometry);
  const catHeart = part(cat, heartGeometry, 0xe8919c, 0, 4.4, 0.5, 0.5, 6);
  const tankHeart = part(tank, heartGeometry, 0xe8919c, 0, 8.5, 0.5, 0.5, 6);
  let reaction: CompanionReaction | null = null;
  let reactionAge = 10;
  const position = { x: PIER_CAT.x, z: PIER_CAT.z };
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
      tank.visible = region === 'home';
      cat.visible = region === 'coast';
      const feed = reaction === COMPANION_REACTION.feed && reactionAge < 3;
      const kept = state.fish.filter((fish) => fish.home === FISH_HOME.tank);
      swimmers.forEach(({ group, body }, i) => {
        const keptFish = kept[i];
        group.visible = Boolean(keptFish);
        if (!keptFish) return;
        const pose = aquariumPose(keptFish, elapsed, feed ? reactionAge : 10, reducedMotion);
        const art = aquariumFishArt(keptFish.id);
        const map = tankTextures.get(art.src);
        if (map && body.material.map !== map) {
          body.material.map = map;
          body.material.needsUpdate = true;
          body.visible = true;
        }
        group.position.set((pose.x - 0.5) * 14, (1 - pose.y) * 9.333, 0);
        group.scale.set(pose.width * 14 * pose.facing, (pose.width * 14) / art.ratio, 1);
        group.rotation.z = -pose.tilt;
        const vertices = body.geometry.getAttribute('position');
        for (let v = 0; v < vertices.count; v++) {
          const x = vertices.getX(v);
          const baseY = 0.5 - Math.floor(v / 17) / 2;
          vertices.setY(
            v,
            baseY + (reducedMotion ? 0 : Math.sin(elapsed * 7 + x * 10 + pose.phase) * 0.045 * (0.5 - x) ** 2),
          );
        }
        vertices.needsUpdate = true;
      });
      bubbles.forEach((bubble, i) => {
        bubble.position.y = 4.7 + ((reducedMotion ? i * 0.4 : elapsed * 0.4 + i * 0.4) % 2.3);
      });
      pellets.forEach((pellet, i) => {
        pellet.visible = feed;
        pellet.position.y = 6.8 - (reducedMotion ? 0 : reactionAge * 0.5) + i * 0.06;
      });
      tankHeart.visible = feed;
      tankHeart.position.y = 8 + (reducedMotion ? 0 : reactionAge * 0.6);
      tankHeart.material.opacity = feed ? Math.sin((reactionAge / 3) * Math.PI) : 0;
      const target = catPosition(state.friendship, fishing !== null);
      const before = position.x;
      const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 2);
      position.x += (target.x - position.x) * ease;
      position.z += (target.z - position.z) * ease;
      const moving = Math.hypot(target.x - position.x, target.z - position.z) > 0.05;
      const scale = characterScale(position.z) * CHILD_SIZE;
      const success =
        fishing?.phase === FISHING_PHASE.caught && fishingAge < 2.4 && catBond(state.friendship).level === 2;
      const jump = success ? catchCelebration(fishingAge, reducedMotion).childLift * 0.7 : 0;
      cat.position.set(sceneX(position.x), sceneY(position.z) + jump * scale, 2);
      cat.scale.setScalar(scale);
      if (texture) {
        const left = moving && position.x < before;
        texture.repeat.x = (left ? -1 : 1) / 4;
        texture.offset.x = ((moving && !reducedMotion ? Math.floor(elapsed * 8) % 4 : 0) + Number(left)) / 4;
      }
      const affection = reaction !== COMPANION_REACTION.feed && reactionAge < 2.4;
      const age = success ? fishingAge : reactionAge;
      catHeart.visible = (success || affection) && age < 2.4;
      catHeart.position.y = 4.2 + (reducedMotion ? 0 : age * 0.7);
      catHeart.material.opacity = Math.max(0, Math.sin((age / 2.4) * Math.PI));
      spriteMaterial.rotation = affection && !reducedMotion ? Math.sin(reactionAge * 5) * 0.09 : 0;
    },
    dispose() {
      disposed = true;
      isTankDisposed = true;
      tankTextures.forEach((item) => item.dispose());
      scene.remove(cat, tank);
      texture?.dispose();
      spriteMaterial.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
