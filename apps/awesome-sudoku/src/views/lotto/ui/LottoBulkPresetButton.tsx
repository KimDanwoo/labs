import { BULK_PRESET_LABEL, LOTTO_COPY, type BulkPreset } from '@views/lotto/config/copy';
import { TICKET_PRICE } from '@views/lotto/config/lotto';
import { formatWon } from '@views/lotto/lib/format';
import { LottoButton } from '@views/lotto/ui/LottoButton';

interface LottoBulkPresetButtonProps {
  count: BulkPreset;
  isDisabled: boolean;
  onRun: (count: number) => void;
}

export function LottoBulkPresetButton({ count, isDisabled, onRun }: LottoBulkPresetButtonProps) {
  const handleClick = () => onRun(count);
  return (
    <LottoButton
      variant="secondary"
      disabled={isDisabled}
      onClick={handleClick}
      className="flex h-auto flex-col items-center gap-0.5 px-2 py-2.5"
    >
      <span className="font-semibold">{BULK_PRESET_LABEL[count]}</span>
      <span className="whitespace-nowrap text-xs text-text-tertiary font-tabular">
        {LOTTO_COPY.bulkCost(formatWon(count * TICKET_PRICE))}
      </span>
    </LottoButton>
  );
}
