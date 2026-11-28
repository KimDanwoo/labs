import { LuBot } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { BOARD_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { SIDE_NAME_CLASS } from '@views/gostop/config/table';
import { SidePurse } from '@views/gostop/ui/SidePurse';

export function RivalProfile() {
  return (
    <p className="flex shrink-0 items-center gap-1.5">
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-full bg-white/10 text-lemon [&_svg]:size-4"
      >
        <LuBot />
      </span>
      <span className="grid gap-[3px]">
        <span className={cn(SIDE_NAME_CLASS, 'leading-none')}>{BOARD_COPY.computerName}</span>
        <SidePurse side={SIDE.COMPUTER} />
      </span>
    </p>
  );
}
