import { cn } from '@shared/lib/cn';
import { STAT_TONE_CLASS, type StatTone } from '@views/lotto/config/style';

interface LottoStatTileProps {
  label: string;
  value: string;
  tone?: StatTone;
}

export function LottoStatTile({ label, value, tone = 'plain' }: LottoStatTileProps) {
  return (
    <div className="min-w-0 space-y-1 rounded-xl bg-bg-tertiary/70 px-3 py-2.5">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className={cn('text-[15px] font-bold font-tabular break-keep sm:text-lg', STAT_TONE_CLASS[tone])}>{value}</dd>
    </div>
  );
}
