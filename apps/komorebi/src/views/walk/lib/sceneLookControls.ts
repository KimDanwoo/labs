import { CANVAS_FONT_FAMILY } from '@views/walk/lib/art';
import { preparePaintingTexture } from '@views/walk/lib/regionPlates';
import type { SceneContext, WalkEngine } from '@views/walk/lib/sceneContext';
import { characterLayers } from '@views/walk/model/world/appearance';
import { REGION } from '@views/walk/model/world/world';

export function createLookControls({
  container,
  state,
  wake,
  parts,
}: SceneContext): Pick<WalkEngine, 'setAppearance' | 'setWeather' | 'setTimeOfDay' | 'photo'> {
  const { loader, loaded, outfits, character, renderer, scene, camera, bedRest } = parts;
  return {
    async setAppearance(next) {
      const request = ++state.appearanceRequest;
      const url = characterLayers(next).outfit;
      try {
        let texture = outfits.get(url);
        if (!texture) {
          texture = preparePaintingTexture(await loader.loadAsync(url));
          if (state.disposed) {
            texture.dispose();
            return false;
          }
          outfits.set(url, texture);
          loaded.push(texture);
        }
        if (state.disposed || request !== state.appearanceRequest) return false;
        state.currentAppearance = next;
        character.setOutfit(texture);
        container.dataset.appearance = `${next.character}-${next.outfit}`;
        if (state.region === REGION.home) void bedRest.prepare(next.character);
        wake();
        return true;
      } catch {
        return false;
      }
    },
    setWeather(value) {
      state.weather = value;
      wake();
    },
    setTimeOfDay(value) {
      state.timeOfDay = value;
      wake();
    },
    photo() {
      renderer.render(scene, camera);
      const canvas = document.createElement('canvas');
      canvas.width = renderer.domElement.width;
      canvas.height = renderer.domElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return Promise.resolve(false);
      ctx.drawImage(renderer.domElement, 0, 0);
      ctx.fillStyle = '#fff9e8';
      ctx.font = `${Math.max(20, canvas.width / 55)}px ${CANVAS_FONT_FAMILY}`;
      ctx.shadowColor = '#18372c';
      ctx.shadowBlur = 5;
      ctx.fillText('여름빛 산책', canvas.width * 0.04, canvas.height * 0.95);
      return new Promise<boolean>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = `komorebi-${state.region}-${Date.now()}.png`;
          a.href = url;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve(true);
        });
      });
    },
  };
}
