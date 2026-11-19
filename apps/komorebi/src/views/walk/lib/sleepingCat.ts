import * as THREE from 'three';
import { REGION, type Region } from '../model/world/world';
import { lampGlowAt, lightSprite } from './nightLights';
import { characterScale, sceneX, sceneY } from './perspective';

const CAT_URL = '/art/cat-sleeping.webp';
const CAT_ORDER = 2.5;
const CAT_SPOT = { region: REGION.village as Region, x: 14.5, z: 35.5 };

export function createSleepingCat(scene: THREE.Scene, loader: THREE.TextureLoader) {
  let isDisposed = false;
  const catMaterial = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const cat = new THREE.Sprite(catMaterial);
  cat.renderOrder = CAT_ORDER;
  cat.visible = false;
  cat.position.set(sceneX(CAT_SPOT.x), sceneY(CAT_SPOT.z), 1);
  scene.add(cat);
  let catTexture: THREE.Texture | null = null;
  let catWidth = 0;
  let catAspect = 1;
  loader
    .loadAsync(CAT_URL)
    .then((texture) => {
      if (isDisposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      catTexture = texture;
      catMaterial.map = texture;
      catMaterial.needsUpdate = true;
      const { width, height } = texture.image as HTMLImageElement;
      catAspect = height / width;
      catWidth = 4.6 * characterScale(CAT_SPOT.z) * 2.2;
    })
    .catch(() => undefined);

  return {
    update(region: Region, elapsed: number, darkness: number, isStill: boolean) {
      cat.visible = catTexture !== null && region === CAT_SPOT.region;
      if (!cat.visible) return;
      const breath = isStill ? 0 : Math.sin(elapsed * 1.6) * 0.025;
      cat.scale.set(catWidth, catWidth * catAspect * (1 + breath), 1);
      lightSprite(catMaterial.color, darkness, lampGlowAt(CAT_SPOT.region, CAT_SPOT));
    },
    dispose() {
      isDisposed = true;
      scene.remove(cat);
      catMaterial.dispose();
      catTexture?.dispose();
    },
  };
}
