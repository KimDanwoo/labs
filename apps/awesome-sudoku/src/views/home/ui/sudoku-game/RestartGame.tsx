import { IconButton } from '@shared/ui/icon-button';
import { requestRestartAtom } from '@views/home/model/store/gameConfirmAtoms';
import { timerActiveAtom } from '@views/home/model/store/primitives';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRotateCcw } from 'react-icons/lu';

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
