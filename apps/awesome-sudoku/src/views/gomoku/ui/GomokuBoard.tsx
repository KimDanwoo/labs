import { GAME_BOARD_SIZE } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';
import { GRID_TEMPLATE } from '@views/gomoku/config/boardView';
import { GOMOKU_COPY } from '@views/gomoku/config/copy';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';
import { BoardGrid } from '@views/gomoku/ui/BoardGrid';
import { GomokuCell } from '@views/gomoku/ui/GomokuCell';

export function GomokuBoard() {
  const { cells } = useGomokuContext();

  return (
    <div className={cn('rounded-[20px] bg-goban p-[3%]', GAME_BOARD_SIZE)}>
      <div className="relative aspect-square">
        <BoardGrid />
        <div
          role="group"
          aria-label={GOMOKU_COPY.boardLabel}
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: GRID_TEMPLATE, gridTemplateRows: GRID_TEMPLATE }}
        >
          {cells.map((stone, cell) => (
            <GomokuCell key={cell} cell={cell} />
          ))}
        </div>
      </div>
    </div>
  );
}
