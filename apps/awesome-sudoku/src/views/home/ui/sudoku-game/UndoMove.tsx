import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuUndo2 } from 'react-icons/lu';
import { canUndoAtom, undoAtom } from '../../model/store/historyAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const UndoMove = () => {
  const undo = useSetAtom(undoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton.Root onClick={undo} disabled={!timerActive || !canUndo}>
      <IconButton.Icon>
        <LuUndo2 strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>되돌리기</IconButton.Label>
    </IconButton.Root>
  );
};
