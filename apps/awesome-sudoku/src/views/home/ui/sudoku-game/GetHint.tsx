import { IconButton } from '@shared/ui/icon-button';
import { getHintAtom } from '@views/home/model/store/hintAtoms';
import { hintsRemainingAtom, timerActiveAtom } from '@views/home/model/store/primitives';
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
