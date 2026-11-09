import { canRedoAtom, redoAtom, timerActiveAtom } from '@entities/game';
import { IconButton } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuRedo2 } from 'react-icons/lu';

export const RedoMove = () => {
  const redo = useSetAtom(redoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const timerActive = useAtomValue(timerActiveAtom);

  return (
    <IconButton icon={<LuRedo2 strokeWidth={2} />} label="재실행" onClick={redo} disabled={!timerActive || !canRedo} />
  );
};
