import { StatusPill } from '@shared/ui/status-pill';
import { GOSTOP_COPY, OUTCOME_TITLE, STATUS_TEXT } from '@views/gostop/config/copy';
import { gameStatus, outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function GostopStatus() {
  const { phase, turn, result, isDecideClosed, openDecide } = useGostopContext();
  const status = gameStatus(phase, turn);
  const isOver = status === 'over';

  if (isDecideClosed) {
    return (
      <button
        type="button"
        aria-label={GOSTOP_COPY.decideReopen}
        onClick={openDecide}
        className="grid min-h-11 place-items-center rounded-full motion-safe:animate-pulse"
      >
        <StatusPill.Root tone="lemon">{STATUS_TEXT[status]}</StatusPill.Root>
      </button>
    );
  }

  return (
    <StatusPill.Root tone={isOver ? 'weak' : 'lemon'}>
      {isOver ? OUTCOME_TITLE[outcomeOf(result)] : STATUS_TEXT[status]}
    </StatusPill.Root>
  );
}
