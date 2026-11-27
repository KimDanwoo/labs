import { cn } from '@shared/lib/cn';
import { STAT_TONE_CLASS, type StatTone } from '@views/lotto/config/style';

interface LottoStatRowProps {
  label: string;
  value: string;
  tone?: StatTone;
}

export function LottoStatRow({ label, value, tone = 'plain' }: LottoStatRowProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-3">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className={cn('text-[17px] font-bold font-tabular whitespace-nowrap', STAT_TONE_CLASS[tone])}>{value}</dd>
    </div>
  );
}
