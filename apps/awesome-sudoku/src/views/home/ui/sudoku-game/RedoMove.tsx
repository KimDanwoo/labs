import { IconButton } from '@shared/ui/IconButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRedo2 } from 'react-icons/lu';
import { canRedoAtom, redoAtom } from '../../model/store/historyAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RedoMove = () => {
  const redo = useSetAtom(redoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton icon={<LuRedo2 strokeWidth={2} />} label="재실행" onClick={redo} disabled={!timerActive || !canRedo} />
  );
};
