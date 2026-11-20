import { AQUARIUM_ART, aquariumFishArt, aquariumPose } from '@views/walk/lib/aquarium';
import type { PartKit } from '@views/walk/lib/companionParts';
import { TANK_CAPACITY, type Companions } from '@views/walk/lib/companions';
import { CHILD_SIZE, characterScale, sceneX, sceneY } from '@views/walk/lib/perspective';
import { HOME_AQUARIUM } from '@views/walk/model/world/landmarks';
import * as THREE from 'three';

export type TankFrame = {
  elapsed: number;
  reducedMotion: boolean;
  feed: boolean;
  reactionAge: number;
  kept: Companions['fish'];
};

export function createTankScene(
  scene: THREE.Scene,
  loader: THREE.TextureLoader | undefined,
  { plane, circle, part, track }: PartKit,
) {
  const tank = new THREE.Group();
  tank.name = 'home-aquarium';
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
    track(geometry);
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

  function update(
    tankHeart: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
    { elapsed, reducedMotion, feed, reactionAge, kept }: TankFrame,
  ) {
    swimmers.forEach(({ group, body }, i) => {
      const keptFish = kept[i];
      group.visible = Boolean(keptFish);
      if (!keptFish) return;
      const pose = aquariumPose(keptFish, elapsed, feed ? reactionAge : 10, reducedMotion);
      const art = aquariumFishArt(keptFish.id);
      const map = tankTextures.get(art.src);
      const hasNewMap = map && body.material.map !== map;
      if (hasNewMap) {
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
  }

  return {
    tank,
    update,
    dispose() {
      isTankDisposed = true;
      tankTextures.forEach((item) => item.dispose());
    },
  };
}
