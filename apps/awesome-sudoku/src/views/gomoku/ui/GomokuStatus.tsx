import { GOMOKU_COPY, MY_TURN, OUTCOME_TITLE } from '@views/gomoku/config/copy';
import { OUTCOME } from '@views/gomoku/config/game';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function GomokuStatus() {
  const { outcome, isThinking, playerStone } = useGomokuContext();
  const turnText = isThinking ? GOMOKU_COPY.thinking : MY_TURN[playerStone];

  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded-full bg-bg-tertiary/80 px-4 py-1.5 text-sm font-semibold text-text-primary backdrop-blur-sm"
    >
      {outcome === OUTCOME.PLAYING ? turnText : OUTCOME_TITLE[outcome]}
    </p>
  );
}
