import { cn } from '@shared/lib/cn';
import { BULK_PRESET_LABEL, LOTTO_COPY, type BulkPreset } from '@views/lotto/config/copy';
import { TICKET_PRICE } from '@views/lotto/config/lotto';
import { GLASS_BUTTON_CLASS, GLASS_LENS_CLASS } from '@views/lotto/config/style';
import { formatWon } from '@views/lotto/lib/format';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

interface LottoBulkOptionProps {
  count: BulkPreset;
  panelId: string;
}

export function LottoBulkOption({ count, panelId }: LottoBulkOptionProps) {
  const { runBulk } = useLottoContext();
  const handleClick = () => runBulk(count);

  return (
    <button
      type="button"
      popoverTarget={panelId}
      popoverTargetAction="hide"
      onClick={handleClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-2xl px-4 py-3.5 text-left',
        GLASS_LENS_CLASS,
        GLASS_BUTTON_CLASS,
      )}
    >
      <span className="text-lg font-semibold text-text-primary font-tabular">{BULK_PRESET_LABEL[count]}</span>
      <span className="text-xs text-text-tertiary font-tabular">
        {LOTTO_COPY.bulkCost(formatWon(count * TICKET_PRICE))}
      </span>
    </button>
  );
}
