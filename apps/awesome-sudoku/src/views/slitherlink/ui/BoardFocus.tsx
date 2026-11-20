import { HINT_GLOW_WIDTH_RATIO, HOVER_WIDTH_RATIO } from '@views/slitherlink/config/boardView';
import { getBoardLayout } from '@views/slitherlink/lib/boardGeometry';
import { segmentAt } from '@views/slitherlink/lib/boardMarks';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { EdgeStroke } from '@views/slitherlink/ui/EdgeStroke';

interface BoardFocusProps {
  hoverEdge: number | null;
}

export function BoardFocus({ hoverEdge }: BoardFocusProps) {
  const { boardSize, lastHintEdge } = useSlitherlinkContext();
  const layout = getBoardLayout(boardSize);
  const hover = segmentAt(layout, hoverEdge);
  const hint = segmentAt(layout, lastHintEdge);

  return (
    <g aria-hidden="true" strokeLinecap="round" className="pointer-events-none">
      {hint && (
        <EdgeStroke
          segment={hint}
          width={layout.style.lineWidth * HINT_GLOW_WIDTH_RATIO}
          className="stroke-hint-text/30 animate-subtle-pulse"
        />
      )}
      {hover && (
        <EdgeStroke segment={hover} width={layout.style.lineWidth * HOVER_WIDTH_RATIO} className="stroke-accent/35" />
      )}
    </g>
  );
}
