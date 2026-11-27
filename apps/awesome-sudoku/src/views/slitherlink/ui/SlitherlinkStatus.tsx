import { GameTimer } from '@views/slitherlink/ui/GameTimer';
import { LevelSwitch } from '@views/slitherlink/ui/LevelSwitch';

export function SlitherlinkStatus() {
  return (
    <>
      <LevelSwitch />
      <GameTimer />
    </>
  );
}
