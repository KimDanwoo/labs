import { cn } from '@shared/lib/cn';
import { STAT_TONE_CLASS, TILE_CLASS, type StatTone } from '@views/lotto/config/style';

interface LottoStatTileProps {
  label: string;
  value: string;
  tone?: StatTone;
}

export function LottoStatTile({ label, value, tone = 'plain' }: LottoStatTileProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 px-3 py-3', TILE_CLASS)}>
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd
        className={cn('text-[15px] font-bold font-tabular text-balance break-keep sm:text-lg', STAT_TONE_CLASS[tone])}
      >
        {value}
      </dd>
    </div>
  );
}
