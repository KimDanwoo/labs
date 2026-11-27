import { cn } from '@shared/lib/cn';
import { StatusPill } from '@shared/ui/status-pill';
import { STONE_DOT_CLASS } from '@views/gomoku/config/stone';
import { statusViewOf } from '@views/gomoku/lib/status';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function GomokuStatus() {
  const { outcome, isThinking, playerStone } = useGomokuContext();
  const status = statusViewOf(outcome, isThinking, playerStone);

  return (
    <StatusPill.Root role="status" aria-live="polite">
      {status.stone && <span aria-hidden="true" className={cn('size-5 rounded-full', STONE_DOT_CLASS[status.stone])} />}
      {status.text}
      {status.note && <StatusPill.Note>{status.note}</StatusPill.Note>}
    </StatusPill.Root>
  );
}
