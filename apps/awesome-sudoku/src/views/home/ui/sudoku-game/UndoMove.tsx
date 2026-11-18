import { IconButton } from '@shared/ui/IconButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuUndo2 } from 'react-icons/lu';
import { canUndoAtom, undoAtom } from '../../model/store/historyAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const UndoMove = () => {
  const undo = useSetAtom(undoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton
      icon={<LuUndo2 strokeWidth={2} />}
      label="되돌리기"
      onClick={undo}
      disabled={!timerActive || !canUndo}
    />
  );
};
