import { cn } from '@shared/lib/cn';
import { STONE } from '@views/gomoku/config/board';
import { cellLabel, stoneClassOf } from '@views/gomoku/lib/board';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';
import { LuX } from 'react-icons/lu';

interface GomokuCellProps {
  cell: number;
}

export function GomokuCell({ cell }: GomokuCellProps) {
  const { cells, forbidden, lastMove, winLine, isLocked, place, playerStone } = useGomokuContext();
  const stone = cells[cell] ?? STONE.EMPTY;
  const isForbidden = forbidden.has(cell);
  const isBlocked = isLocked || isForbidden || stone !== STONE.EMPTY;

  const handleClick = () => {
    if (!isBlocked) place(cell);
  };

  return (
    <button
      type="button"
      aria-label={cellLabel(cell, stone, isForbidden)}
      aria-disabled={isBlocked}
      onClick={handleClick}
      className="group relative flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-disabled:cursor-default"
    >
      <span
        className={cn(
          'size-[88%] rounded-full transition-opacity',
          stoneClassOf(stone, playerStone),
          isForbidden && 'hidden',
          winLine?.includes(cell) && 'ring-2 ring-accent',
        )}
      />
      {isForbidden && <LuX aria-hidden="true" className="absolute size-3 text-error-text" strokeWidth={3} />}
      {cell === lastMove && <span className="absolute size-1.5 rounded-full bg-accent" />}
    </button>
  );
}
