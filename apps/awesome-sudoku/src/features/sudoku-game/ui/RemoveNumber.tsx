import { fillCellAtom, timerActiveAtom } from '@features/sudoku-game/model/atoms';
import { IconButton } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuEraser } from 'react-icons/lu';

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
