import { canvasTexture } from '@views/walk/lib/art';
import { CHALK_LAYER, paintChalk } from '@views/walk/lib/chalkboard';
import { chalkboardStore } from '@views/walk/model/store/chalkboard';
import * as THREE from 'three';

export function createChalkLayer(onChange: () => void) {
  const texture = canvasTexture(CHALK_LAYER.width, CHALK_LAYER.height, (ctx) => paintChalk(ctx, chalkboardStore.get()));
  // Uploaded as raw premultiplied sRGB bytes; the shader un-premultiplies, then linearises (see CHALK_GLSL).
  texture.colorSpace = THREE.NoColorSpace;
  texture.premultiplyAlpha = true;
  const unsubscribe = chalkboardStore.subscribe(() => {
    const { image } = texture;
    const ctx = image instanceof HTMLCanvasElement ? image.getContext('2d') : null;
    if (!ctx) return;
    paintChalk(ctx, chalkboardStore.get());
    texture.needsUpdate = true;
    onChange();
  });
  return {
    texture,
    dispose() {
      unsubscribe();
      texture.dispose();
    },
  };
}
