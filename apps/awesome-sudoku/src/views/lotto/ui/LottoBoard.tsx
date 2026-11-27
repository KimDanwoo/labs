import { cn } from '@shared/lib/cn';
import { AMBIENT_GLOW_CLASS, GLASS_EDGE_CLASS, GLASS_PANE_CLASS } from '@views/lotto/config/style';
import { LottoNumberGrid } from '@views/lotto/ui/LottoNumberGrid';
import { LottoTray } from '@views/lotto/ui/LottoTray';

export function LottoBoard() {
  return (
    <div className="relative isolate w-full max-w-[560px]">
      <div aria-hidden="true" className={AMBIENT_GLOW_CLASS} />
      <div className={cn('flex flex-col gap-2 rounded-3xl p-2 sm:gap-3 sm:p-4', GLASS_PANE_CLASS, GLASS_EDGE_CLASS)}>
        <LottoTray />
        <LottoNumberGrid />
      </div>
    </div>
  );
}
