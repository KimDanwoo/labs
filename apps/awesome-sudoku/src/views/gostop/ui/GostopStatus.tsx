import { StatusPill } from '@shared/ui/status-pill';
import { OUTCOME_TITLE, STATUS_TEXT } from '@views/gostop/config/copy';
import { gameStatus, outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function GostopStatus() {
  const { phase, turn, result } = useGostopContext();
  const status = gameStatus(phase, turn);
  const isOver = status === 'over';

  return (
    <StatusPill.Root tone={isOver ? 'weak' : 'lemon'}>
      {isOver ? OUTCOME_TITLE[outcomeOf(result)] : STATUS_TEXT[status]}
    </StatusPill.Root>
  );
}
