import { MONEY_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { MoneyTransfer } from '@views/gostop/ui/MoneyTransfer';
import { ResultSummary } from '@views/gostop/ui/ResultSummary';

export function ResultLedger() {
  const { settlement } = useGostopContext();
  if (!settlement) return null;

  return (
    <section aria-label={MONEY_COPY.settleTitle} className="mt-2.5 grid gap-2.5 rounded-2xl bg-weak p-3">
      <ResultSummary />
      <MoneyTransfer />
    </section>
  );
}
