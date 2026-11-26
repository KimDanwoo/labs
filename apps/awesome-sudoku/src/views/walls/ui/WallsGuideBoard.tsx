import { BOARD_SIZE, SIDE } from '@views/walls/config/board';
import { colOf, rowOf, sideOfPawn, STEPS } from '@views/walls/lib/grid';
import { getGuideCellRole } from '@views/walls/lib/guideBoard';
import type { WallsGuideModel } from '@views/walls/model/hooks/useWallsGuide';
import styles from '@views/walls/ui/WallsGuide.module.css';

interface WallsGuideBoardProps {
  guide: WallsGuideModel;
}

export function WallsGuideBoard({ guide }: WallsGuideBoardProps) {
  const { board, selection, targets, territory, pickCell } = guide;
  const isWon = Boolean(territory);
  const { pawn, target } = selection;
  const isPreviewing = pawn !== null && target !== null && !isWon;
  const currentCell = pawn === null ? undefined : board.pawns[pawn];
  const displayedPawns = isPreviewing
    ? board.pawns.map((cell, index) => (index === pawn ? target : cell))
    : board.pawns;

  return (
    <div className={styles.board} role="group" aria-label={`${BOARD_SIZE}×${BOARD_SIZE} 담쌓기 판`}>
      {STEPS.map((steps, cell) => {
        const occupant = displayedPawns.indexOf(cell);
        const side = occupant < 0 ? null : sideOfPawn(occupant);
        const isMine = side === SIDE.ME;
        const isCurrent = cell === currentCell;
        const isTarget = targets.includes(cell);
        const canPick = !isWon && (isMine || isTarget);
        const role = getGuideCellRole(side);
        const south = steps[1];
        const east = steps[3];
        const hasSouthWall = Boolean(south && board.walls[south.edge]);
        const hasEastWall = Boolean(east && board.walls[east.edge]);

        return (
          <button
            key={cell}
            type="button"
            aria-label={`${rowOf(cell) + 1}행 ${colOf(cell) + 1}열 ${role}`}
            aria-pressed={isCurrent || selection.target === cell}
            className={styles.cell}
            data-side={side}
            data-target={isTarget && !isWon}
            data-territory={territory?.owners[cell]}
            data-south-wall={hasSouthWall}
            data-east-wall={hasEastWall}
            disabled={!canPick}
            onClick={() => pickCell(cell)}
          >
            {side === null ? null : <span className={styles.pawn} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
