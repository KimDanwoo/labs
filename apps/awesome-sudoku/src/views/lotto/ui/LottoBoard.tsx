import { GAME_WIDE_BOARD_SIZE } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';
import { LOTTO_BOARD_SIZE } from '@views/lotto/config/style';
import { LottoNumberGrid } from '@views/lotto/ui/LottoNumberGrid';
import { LottoTray } from '@views/lotto/ui/LottoTray';

export function LottoBoard() {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-[20px] bg-face p-2.5 sm:gap-3 sm:p-4',
        GAME_WIDE_BOARD_SIZE,
        LOTTO_BOARD_SIZE,
      )}
    >
      <LottoTray />
      <LottoNumberGrid />
    </div>
  );
}
