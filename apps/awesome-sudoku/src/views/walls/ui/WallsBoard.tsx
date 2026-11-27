import { GAME_BOARD_SIZE } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';
import { GRID_TEMPLATE } from '@views/walls/config/boardView';
import { WALLS_COPY } from '@views/walls/config/copy';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';
import { BoardPawns } from '@views/walls/ui/BoardPawns';
import { BoardWalls } from '@views/walls/ui/BoardWalls';
import { WallChoices } from '@views/walls/ui/WallChoices';
import { WallsCell } from '@views/walls/ui/WallsCell';

export function WallsBoard() {
  const { owners } = useWallsContext();

  return (
    <div className={cn('rounded-[20px] bg-face p-1.5', GAME_BOARD_SIZE)}>
      <div className="relative aspect-square">
        <div
          role="group"
          aria-label={WALLS_COPY.boardLabel}
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: GRID_TEMPLATE, gridTemplateRows: GRID_TEMPLATE }}
        >
          {owners.map((owner, cell) => (
            <WallsCell key={cell} cell={cell} />
          ))}
        </div>
        <BoardPawns />
        <BoardWalls />
        <WallChoices />
      </div>
    </div>
  );
}
