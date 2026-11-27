import { cn } from '@shared/lib/cn';
import { cellView } from '@views/walls/lib/cellView';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

interface WallsCellProps {
  cell: number;
}

export function WallsCell({ cell }: WallsCellProps) {
  const game = useWallsContext();
  const view = cellView(game, cell);

  const handleClick = () => game.pickCell(cell);

  return (
    <button
      type="button"
      aria-label={view.label}
      onClick={handleClick}
      className={cn(
        'relative m-[4%] flex items-center justify-center rounded-md transition-colors duration-300 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        view.tintClass,
      )}
    >
      {view.isTarget && <span className="size-[26%] rounded-full bg-text-tertiary/60" />}
    </button>
  );
}
