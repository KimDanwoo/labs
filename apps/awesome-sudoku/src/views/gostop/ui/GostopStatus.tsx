import { StatusPill } from '@shared/ui/status-pill';
import { GOSTOP_COPY, OUTCOME_TITLE, STATUS_TEXT } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { gameStatus, goNote, outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function GostopStatus() {
  const { phase, turn, scores, goCount, result } = useGostopContext();
  const status = gameStatus(phase, turn);
  const isOver = status === 'over';
  const isReady = status === 'ready';

  return (
    <StatusPill.Root role="status" aria-live="polite" tone={isOver ? 'weak' : 'lemon'}>
      {isOver ? OUTCOME_TITLE[outcomeOf(result)] : STATUS_TEXT[status]}
      {!isReady && (
        <StatusPill.Note>
          {GOSTOP_COPY.me} {scores[SIDE.ME].total} : {scores[SIDE.COMPUTER].total} {GOSTOP_COPY.computer}
          {goNote(goCount)}
        </StatusPill.Note>
      )}
    </StatusPill.Root>
  );
}
