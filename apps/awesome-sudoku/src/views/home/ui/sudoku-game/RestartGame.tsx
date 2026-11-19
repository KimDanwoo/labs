import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRotateCcw } from 'react-icons/lu';
import { resetUserInputsAtom } from '../../model/store/cellValueAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RestartGame = () => {
  const resetUserInputs = useSetAtom(resetUserInputsAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton.Root onClick={resetUserInputs} disabled={!timerActive}>
      <IconButton.Icon>
        <LuRotateCcw strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>다시</IconButton.Label>
    </IconButton.Root>
  );
};
