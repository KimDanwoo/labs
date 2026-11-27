import { LOTTO_COPY } from '@views/lotto/config/copy';
import { BULK_TICKET_PRESETS } from '@views/lotto/config/lotto';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoBulkPresetButton } from '@views/lotto/ui/LottoBulkPresetButton';
import { LottoBulkProgress } from '@views/lotto/ui/LottoBulkProgress';
import { LottoSection } from '@views/lotto/ui/LottoSection';

export function LottoBulkRun() {
  const { isTicketComplete, isSimulating, runBulk } = useLottoContext();
  const canRun = isTicketComplete && !isSimulating;
  return (
    <LottoSection
      title={LOTTO_COPY.bulkTitle}
      description={isTicketComplete ? LOTTO_COPY.bulkDescription : LOTTO_COPY.lockedHint}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BULK_TICKET_PRESETS.map((count) => (
          <LottoBulkPresetButton key={count} count={count} isDisabled={!canRun} onRun={runBulk} />
        ))}
      </div>
      <LottoBulkProgress />
    </LottoSection>
  );
}
