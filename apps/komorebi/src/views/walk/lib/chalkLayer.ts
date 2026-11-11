import { chalkboardStore } from '../model/store/chalkboard';
import { canvasTexture } from './art';
import { CHALK_LAYER, paintChalk } from './chalkboard';

/** The classroom slate's chalk, redrawn whenever the saved board changes. */
export function createChalkLayer(onChange: () => void) {
  const texture = canvasTexture(CHALK_LAYER.width, CHALK_LAYER.height, (ctx) => paintChalk(ctx, chalkboardStore.get()));
  // Transparent edges would otherwise blend towards black and leave a dark rim around each line.
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
