import { RESULT_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { ResultMultipliers } from '@views/gostop/ui/ResultMultipliers';
import { ResultRow } from '@views/gostop/ui/ResultRow';
import { ScoreLineChips } from '@views/gostop/ui/ScoreLineChips';
import { SettlementFormula } from '@views/gostop/ui/SettlementFormula';

export function ResultSummary() {
  const { result } = useGostopContext();
  if (!result?.winner) return null;
  const hasMultiplier = result.goCount > 0 || result.baks.length > 0;

  return (
    <dl className="grid gap-2">
      <ResultRow label={RESULT_COPY.ledgerScore}>
        <ScoreLineChips side={result.winner} />
      </ResultRow>
      {hasMultiplier && (
        <ResultRow label={RESULT_COPY.ledgerMultiplier}>
          <ResultMultipliers />
        </ResultRow>
      )}
      <ResultRow label={RESULT_COPY.ledgerSettle}>
        <SettlementFormula />
      </ResultRow>
    </dl>
  );
}
