import { cn } from '@shared/lib/cn';
import { BOARD_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { SIDE_NAME_CLASS } from '@views/gostop/config/table';
import { SidePurse } from '@views/gostop/ui/SidePurse';

export function RivalProfile() {
  return (
    <p className="grid shrink-0 gap-[3px]">
      <span className={cn(SIDE_NAME_CLASS, 'leading-none')}>{BOARD_COPY.computerName}</span>
      <SidePurse side={SIDE.COMPUTER} />
    </p>
  );
}
