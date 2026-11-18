import { IconButton } from '@shared/ui/IconButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuPencil } from 'react-icons/lu';
import { toggleNoteModeAtom } from '../../model/store/cellValueAtoms';
import { isNoteModeAtom, timerActiveAtom } from '../../model/store/primitives';

export const ToggleNote = () => {
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const toggleNoteMode = useSetAtom(toggleNoteModeAtom);

  return (
    <IconButton
      icon={<LuPencil strokeWidth={2} />}
      label="메모"
      onClick={toggleNoteMode}
      disabled={!timerActive}
      variant={isNoteMode ? 'primary' : 'default'}
    />
  );
};
