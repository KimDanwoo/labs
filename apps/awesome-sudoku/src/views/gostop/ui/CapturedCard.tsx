import { cn } from '@shared/lib/cn';
import { CAPTURED_CARD, CAPTURED_SLOT } from '@views/gostop/config/table';
import type { Side } from '@views/gostop/model/types/gostop';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface CapturedCardProps {
  id: number;
  side: Side;
}

export function CapturedCard({ id, side }: CapturedCardProps) {
  return (
    <li className={cn('relative min-w-0 shrink grow-0 last:shrink-0', CAPTURED_SLOT[side])}>
      <div data-card={id} className={cn('absolute top-0 left-0', CAPTURED_CARD[side])}>
        <HwatuCard id={id} isMini className="rounded-[3px] shadow-[0_1px_3px_rgb(0_0_0/0.5)]" />
      </div>
    </li>
  );
}
