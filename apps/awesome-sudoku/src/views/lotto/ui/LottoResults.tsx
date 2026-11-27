import { RESULTS_STATUS_NOTE } from '@views/lotto/config/copy';
import { resultsTitleOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoMoneySummary } from '@views/lotto/ui/LottoMoneySummary';
import { LottoRankTally } from '@views/lotto/ui/LottoRankTally';
import { LottoSection } from '@views/lotto/ui/LottoSection';

export function LottoResults() {
  const { simulation } = useLottoContext();
  const tally = simulation.result?.tally;
  if (!tally) return null;
  return (
    <LottoSection title={resultsTitleOf(simulation.request)} description={RESULTS_STATUS_NOTE[simulation.status]}>
      <LottoRankTally tally={tally} />
      <LottoMoneySummary tally={tally} />
    </LottoSection>
  );
}
