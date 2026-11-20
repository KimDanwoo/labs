import { getHintAtom } from '@entities/sudoku/model/store/hintAtoms';
import { hintsRemainingAtom, timerActiveAtom } from '@entities/sudoku/model/store/primitives';
import { IconButton } from '@shared/ui/icon-button';
import { useAtomValue, useSetAtom } from 'jotai';
import { LuLightbulb } from 'react-icons/lu';

export const GetHint = () => {
  const getHint = useSetAtom(getHintAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const hintsRemaining = useAtomValue(hintsRemainingAtom);

  return (
    <IconButton.Root onClick={() => getHint()} disabled={!timerActive || hintsRemaining <= 0}>
      <IconButton.Icon>
        <LuLightbulb strokeWidth={2} />
      </IconButton.Icon>
      <IconButton.Label>힌트</IconButton.Label>
      <IconButton.Badge>{hintsRemaining}</IconButton.Badge>
    </IconButton.Root>
  );
};
