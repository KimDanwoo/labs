import { TouchControls } from '@features/runner-control/ui';
import { Hud } from '@widgets/hud/ui';
import { SceneCanvas, SceneLoader } from '@widgets/scene/ui';

export function RideView() {
  return (
    <main className="relative h-dvh w-full touch-none select-none overflow-hidden overscroll-none">
      <SceneCanvas />
      <SceneLoader />
      <Hud />
      <TouchControls />
    </main>
  );
}
