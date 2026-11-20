import { preloadSceneAssets } from '@views/ride/lib/scene/preloadSceneAssets';
import { Hud } from '@views/ride/ui/hud/Hud';
import { TouchControls } from '@views/ride/ui/runner-control/TouchControls';
import { SceneBoundary } from '@views/ride/ui/scene/SceneBoundary';
import { SceneCanvas } from '@views/ride/ui/scene/SceneCanvas';
import { SceneLoader } from '@views/ride/ui/scene/SceneLoader';

export function RideView() {
  preloadSceneAssets();
  return (
    <main className="relative h-dvh w-full touch-none select-none overflow-hidden overscroll-none">
      <SceneBoundary>
        <SceneCanvas />
        <div aria-hidden className="scene-vignette pointer-events-none absolute inset-0" />
        <SceneLoader />
        <Hud />
        <TouchControls />
      </SceneBoundary>
    </main>
  );
}
