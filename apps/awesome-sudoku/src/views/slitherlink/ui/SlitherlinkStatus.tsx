import { GameTimer } from '@views/slitherlink/ui/GameTimer';
import { HintCount } from '@views/slitherlink/ui/HintCount';
import { LevelSwitch } from '@views/slitherlink/ui/LevelSwitch';

export function SlitherlinkStatus() {
  return (
    <div className="mb-4 flex w-full max-w-[400px] items-center justify-between gap-2 lg:max-w-none">
      <LevelSwitch />
      <div className="flex items-center gap-2">
        <HintCount />
        <GameTimer />
      </div>
    </div>
  );
}
