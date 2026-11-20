import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { getBoardLayout } from '@views/slitherlink/lib/boardGeometry';
import { useBoardPointer } from '@views/slitherlink/model/hooks/useBoardPointer';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { BoardClues } from '@views/slitherlink/ui/BoardClues';
import { BoardCrosses } from '@views/slitherlink/ui/BoardCrosses';
import { BoardDots } from '@views/slitherlink/ui/BoardDots';
import { BoardFocus } from '@views/slitherlink/ui/BoardFocus';
import { BoardLines } from '@views/slitherlink/ui/BoardLines';
import { GeneratingOverlay } from '@views/slitherlink/ui/GeneratingOverlay';
import { useRef } from 'react';

export function SlitherlinkBoard() {
  const { boardSize } = useSlitherlinkContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const { hoverEdge, handlers } = useBoardPointer(svgRef);
  const layout = getBoardLayout(boardSize);

  return (
    <div className="relative w-full max-w-[400px] max-lg:landscape:max-w-[calc(100svh-6rem)] lg:w-[432px] lg:max-w-none xl:w-[504px]">
      <div
        aria-hidden="true"
        className="absolute -inset-3 rounded-3xl bg-linear-to-br from-gradient-from/15 to-gradient-to/10 opacity-70 blur-2xl"
      />
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-primary shadow-xl shadow-gradient-from/5 ring-1 ring-border-light">
        <svg
          ref={svgRef}
          viewBox={layout.viewBox}
          role="img"
          aria-label={`${SLITHERLINK_COPY.boardLabel} ${boardSize}×${boardSize}`}
          className="block size-full cursor-pointer touch-none select-none"
          {...handlers}
        >
          <BoardClues />
          <BoardCrosses />
          <BoardDots />
          <BoardFocus hoverEdge={hoverEdge} />
          <BoardLines />
        </svg>
        <GeneratingOverlay />
      </div>
    </div>
  );
}
