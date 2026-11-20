import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRotateCcw } from 'react-icons/lu';
import { requestRestartAtom } from '../../model/store/gameConfirmAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RestartGame = () => {
  const requestRestart = useSetAtom(requestRestartAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton.Root onClick={requestRestart} disabled={!timerActive}>
      <IconButton.Icon>
        <LuRotateCcw strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>다시</IconButton.Label>
    </IconButton.Root>
  );
};
