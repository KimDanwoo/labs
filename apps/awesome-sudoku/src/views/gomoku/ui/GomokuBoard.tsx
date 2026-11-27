import { GRID_TEMPLATE } from '@views/gomoku/config/boardView';
import { GOMOKU_COPY } from '@views/gomoku/config/copy';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';
import { BoardGrid } from '@views/gomoku/ui/BoardGrid';
import { GomokuCell } from '@views/gomoku/ui/GomokuCell';

export function GomokuBoard() {
  const { cells } = useGomokuContext();

  return (
    <div className="relative aspect-square w-full max-w-[560px] overflow-hidden rounded-2xl bg-goban ring-1 ring-border-light max-lg:landscape:max-w-[calc(100svh-6rem)]">
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
  );
}
