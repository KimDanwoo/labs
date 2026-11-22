import { GOMOKU_COPY, OUTCOME_TITLE } from '@views/gomoku/config/copy';
import { OUTCOME } from '@views/gomoku/config/game';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function GomokuStatus() {
  const { outcome, isThinking } = useGomokuContext();
  const turnText = isThinking ? GOMOKU_COPY.thinking : GOMOKU_COPY.myTurn;

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
