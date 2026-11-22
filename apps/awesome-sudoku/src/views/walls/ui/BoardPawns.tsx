import { cn } from '@shared/lib/cn';
import { PAWN_CLASS, PAWN_RING_CLASS } from '@views/walls/config/cellStyle';
import { cellCenter } from '@views/walls/lib/edgeGeometry';
import { sideOfPawn } from '@views/walls/lib/grid';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function BoardPawns() {
  const { pawns, selectedPawn } = useWallsContext();

  return pawns.map((cell, pawn) => (
    <span
      key={pawn}
      aria-hidden="true"
      style={cellCenter(cell)}
      className={cn(
        'pointer-events-none absolute z-10 size-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow-md transition-[left,top,scale] duration-300 ease-out motion-reduce:transition-none',
        PAWN_CLASS[sideOfPawn(pawn)],
        pawn === selectedPawn && PAWN_RING_CLASS,
      )}
    />
  ));
}
