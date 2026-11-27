import type { ReactNode } from 'react';

import { GAME_BOARD_SIZE } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';
import { GUESS_BOARD_SHAPE } from '@views/guess-word/config/style';

interface GuessWordBoardProps {
  children: ReactNode;
}

export function GuessWordBoard({ children }: GuessWordBoardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden rounded-[20px] bg-face p-2.5',
        GAME_BOARD_SIZE,
        GUESS_BOARD_SHAPE,
      )}
    >
      {children}
    </div>
  );
}
