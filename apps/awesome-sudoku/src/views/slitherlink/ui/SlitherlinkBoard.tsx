import { GAME_BOARD_SIZE } from '@shared/config/gameLayout';
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
import { WrongLoopNotice } from '@views/slitherlink/ui/WrongLoopNotice';
import { useRef } from 'react';

export function SlitherlinkBoard() {
  const { boardSize } = useSlitherlinkContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const { hoverEdge, handlers } = useBoardPointer(svgRef);
  const layout = getBoardLayout(boardSize);

  return (
    <div className={GAME_BOARD_SIZE}>
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-face">
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
        <WrongLoopNotice />
        <GeneratingOverlay />
      </div>
    </div>
  );
}
