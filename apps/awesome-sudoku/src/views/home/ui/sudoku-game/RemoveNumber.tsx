import { IconButton } from '@shared/ui/IconButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuEraser } from 'react-icons/lu';
import { fillCellAtom } from '../../model/store/cellValueAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RemoveNumber = () => {
  const timerActive = useAtomValue(timerActiveAtom);
  const fillCell = useSetAtom(fillCellAtom);

  return (
    <IconButton
      icon={<LuEraser strokeWidth={2} />}
      label="지우기"
      onClick={() => fillCell(null)}
      disabled={!timerActive}
    />
  );
};
