import { cn } from '@shared/lib/cn';
import { GLASS_LENS_CLASS, STAT_TONE_CLASS, type StatTone } from '@views/lotto/config/style';

interface LottoStatTileProps {
  label: string;
  value: string;
  tone?: StatTone;
}

export function LottoStatTile({ label, value, tone = 'plain' }: LottoStatTileProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 rounded-2xl px-3 py-3', GLASS_LENS_CLASS)}>
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd
        className={cn('text-[15px] font-bold font-tabular text-balance break-keep sm:text-lg', STAT_TONE_CLASS[tone])}
      >
        {value}
      </dd>
    </div>
  );
}
