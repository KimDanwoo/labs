import { IconButton } from '@shared/ui/IconButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuLightbulb } from 'react-icons/lu';
import { getHintAtom } from '../../model/store/hintAtoms';
import { hintsRemainingAtom, timerActiveAtom } from '../../model/store/primitives';

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
