import { resetUserInputsAtom, timerActiveAtom } from '@features/sudoku-game/model/atoms';
import { IconButton } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRotateCcw } from 'react-icons/lu';

export const RestartGame = () => {
  const resetUserInputs = useSetAtom(resetUserInputsAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton icon={<LuRotateCcw strokeWidth={2} />} label="다시" onClick={resetUserInputs} disabled={!timerActive} />
  );
};
