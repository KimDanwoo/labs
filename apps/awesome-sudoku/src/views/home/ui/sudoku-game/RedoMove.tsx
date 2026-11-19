import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRedo2 } from 'react-icons/lu';
import { canRedoAtom, redoAtom } from '../../model/store/historyAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RedoMove = () => {
  const redo = useSetAtom(redoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton.Root onClick={redo} disabled={!timerActive || !canRedo}>
      <IconButton.Icon>
        <LuRedo2 strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>재실행</IconButton.Label>
    </IconButton.Root>
  );
};
