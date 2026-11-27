import { JACKPOT_OUTCOME_TEXT } from '@views/lotto/config/copy';
import { jackpotFactsOf, jackpotOutcomeOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoJackpotOutcome() {
  const { simulation } = useLottoContext();
  const message = JACKPOT_OUTCOME_TEXT[jackpotOutcomeOf(simulation)](jackpotFactsOf(simulation.result?.tally ?? null));
  return (
    <div role="status" aria-live="polite" className="text-center break-keep">
      {message && (
        <div className="space-y-1 rounded-xl bg-bg-tertiary/70 px-4 py-4">
          <p className="text-xl font-bold text-text-primary font-tabular">{message.title}</p>
          <p className="text-sm leading-relaxed text-text-secondary">{message.detail}</p>
        </div>
      )}
    </div>
  );
}
