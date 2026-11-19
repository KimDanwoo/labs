import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuEraser } from 'react-icons/lu';
import { fillCellAtom } from '../../model/store/cellValueAtoms';
import { timerActiveAtom } from '../../model/store/primitives';

export const RemoveNumber = () => {
  const timerActive = useAtomValue(timerActiveAtom);
  const fillCell = useSetAtom(fillCellAtom);

  return (
    <IconButton.Root onClick={() => fillCell(null)} disabled={!timerActive}>
      <IconButton.Icon>
        <LuEraser strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>지우기</IconButton.Label>
    </IconButton.Root>
  );
};
