import { IconButton } from '@shared/ui/icon-button';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { LuLightbulb, LuPlus, LuRedo2, LuUndo2 } from 'react-icons/lu';

export function GameControls() {
  const { canUndo, canRedo, canHint, hintsRemaining, level, undo, redo, takeHint, confirm } = useSlitherlinkContext();

  const handleNewGame = () => confirm.request(level);

  return (
    <div className="grid grid-cols-4 gap-2">
      <IconButton.Root type="button" onClick={undo} disabled={!canUndo}>
        <IconButton.Icon>
          <LuUndo2 strokeWidth={2} />
        </IconButton.Icon>
        <IconButton.Label>{SLITHERLINK_COPY.undo}</IconButton.Label>
      </IconButton.Root>
      <IconButton.Root type="button" onClick={redo} disabled={!canRedo}>
        <IconButton.Icon>
          <LuRedo2 strokeWidth={2} />
        </IconButton.Icon>
        <IconButton.Label>{SLITHERLINK_COPY.redo}</IconButton.Label>
      </IconButton.Root>
      <IconButton.Root
        type="button"
        aria-label={SLITHERLINK_COPY.hintLabel(hintsRemaining)}
        onClick={takeHint}
        disabled={!canHint}
      >
        <IconButton.Icon>
          <LuLightbulb strokeWidth={2} />
        </IconButton.Icon>
        <IconButton.Label>{SLITHERLINK_COPY.hint}</IconButton.Label>
        <IconButton.Badge>{hintsRemaining}</IconButton.Badge>
      </IconButton.Root>
      <IconButton.Root type="button" variant="primary" onClick={handleNewGame}>
        <IconButton.Icon>
          <LuPlus strokeWidth={2} />
        </IconButton.Icon>
        <IconButton.Label>{SLITHERLINK_COPY.newGame}</IconButton.Label>
      </IconButton.Root>
    </div>
  );
}
