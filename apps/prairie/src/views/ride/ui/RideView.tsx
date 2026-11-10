import { Hud } from './hud/Hud';
import { TouchControls } from './runner-control/TouchControls';
import { SceneBoundary } from './scene/SceneBoundary';
import { SceneCanvas } from './scene/SceneCanvas';
import { SceneLoader } from './scene/SceneLoader';

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
