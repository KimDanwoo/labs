import { cn } from '@shared/lib/cn';
import { LOTTO_COPY, rankResultText } from '@views/lotto/config/copy';
import { VERDICT_REVEAL_CLASS } from '@views/lotto/config/style';
import { countMatches } from '@views/lotto/lib/rank';
import { verdictRevealStyle } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoDrawVerdict() {
  const { singleDraw } = useLottoContext();
  const isWinning = (singleDraw?.rank ?? null) !== null;
  return (
    <p role="status" aria-live="polite" className="min-h-6 text-center text-sm break-keep">
      {singleDraw && (
        <span key={singleDraw.round} className={cn('inline-block', VERDICT_REVEAL_CLASS)} style={verdictRevealStyle}>
          <span className="text-text-secondary">
            {LOTTO_COPY.matches(countMatches(singleDraw.ticket, singleDraw.draw.numbers))}
          </span>
          <span aria-hidden className="mx-2 text-text-tertiary">
            ·
          </span>
          <strong className={cn('font-bold', isWinning ? 'text-accent-text' : 'text-text-primary')}>
            {rankResultText(singleDraw.rank)}
          </strong>
        </span>
      )}
    </p>
  );
}
