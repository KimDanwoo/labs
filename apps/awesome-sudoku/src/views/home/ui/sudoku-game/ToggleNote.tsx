import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuPencil } from 'react-icons/lu';
import { toggleNoteModeAtom } from '../../model/store/cellValueAtoms';
import { isNoteModeAtom, timerActiveAtom } from '../../model/store/primitives';

export const ToggleNote = () => {
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const toggleNoteMode = useSetAtom(toggleNoteModeAtom);

  return (
    <IconButton.Root onClick={toggleNoteMode} disabled={!timerActive} variant={isNoteMode ? 'primary' : 'default'}>
      <IconButton.Icon>
        <LuPencil strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>메모</IconButton.Label>
    </IconButton.Root>
  );
};
