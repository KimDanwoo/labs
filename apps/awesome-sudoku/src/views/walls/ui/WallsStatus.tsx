import { StatusPill } from '@shared/ui/status-pill';
import { OUTCOME_TITLE, STEP_NOTE, STEP_TEXT } from '@views/walls/config/copy';
import { OUTCOME } from '@views/walls/config/game';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function WallsStatus() {
  const { outcome, step } = useWallsContext();
  const isPlaying = outcome === OUTCOME.PLAYING;
  const note = isPlaying ? STEP_NOTE[step] : undefined;

  return (
    <StatusPill.Root role="status" aria-live="polite">
      {isPlaying ? STEP_TEXT[step] : OUTCOME_TITLE[outcome]}
      {note && <StatusPill.Note>{note}</StatusPill.Note>}
    </StatusPill.Root>
  );
}
