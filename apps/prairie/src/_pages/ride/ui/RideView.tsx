import { TouchControls } from '@features/runner-control';
import { Hud } from '@widgets/hud';
import { SceneBoundary, SceneCanvas, SceneLoader } from '@widgets/scene';

export function RideView() {
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
