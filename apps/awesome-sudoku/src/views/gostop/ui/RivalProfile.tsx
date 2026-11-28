import { LuBot } from 'react-icons/lu';

import { BOARD_COPY } from '@views/gostop/config/copy';
import { SIDE_NAME_CLASS } from '@views/gostop/config/table';

export function RivalProfile() {
  return (
    <p className="flex shrink-0 items-center gap-1.5">
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-full bg-white/10 text-lemon [&_svg]:size-4"
      >
        <LuBot />
      </span>
      <span className={SIDE_NAME_CLASS}>{BOARD_COPY.computerName}</span>
    </p>
  );
}
