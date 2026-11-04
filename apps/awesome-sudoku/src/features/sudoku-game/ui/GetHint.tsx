import { getHintAtom, hintsRemainingAtom, timerActiveAtom } from '@entities/game/model/store';
import { IconButton } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuLightbulb } from 'react-icons/lu';

export const GetHint = () => {
  const getHint = useSetAtom(getHintAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const hintsRemaining = useAtomValue(hintsRemainingAtom);

  return (
    <IconButton
      icon={<LuLightbulb strokeWidth={2} />}
      label="힌트"
      onClick={() => getHint()}
      disabled={!timerActive || hintsRemaining <= 0}
      badge={hintsRemaining}
    />
  );
};
