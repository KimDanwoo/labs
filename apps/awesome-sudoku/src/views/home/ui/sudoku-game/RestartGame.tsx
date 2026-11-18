import { IconButton } from '@shared/ui/IconButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRotateCcw } from 'react-icons/lu';
import { resetUserInputsAtom } from '../../model/store/cellValueAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RestartGame = () => {
  const resetUserInputs = useSetAtom(resetUserInputsAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton icon={<LuRotateCcw strokeWidth={2} />} label="다시" onClick={resetUserInputs} disabled={!timerActive} />
  );
};
