import { Hud } from '@widgets/hud/ui';
import { SceneCanvas, SceneLoader } from '@widgets/scene/ui';

export function RideView() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <SceneCanvas />
      <SceneLoader />
      <Hud />
    </main>
  );
}
