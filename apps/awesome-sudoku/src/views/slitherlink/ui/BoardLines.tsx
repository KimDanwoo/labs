import { cn } from '@shared/lib/cn';
import { EDGE } from '@views/slitherlink/config/board';
import { getBoardLayout } from '@views/slitherlink/lib/boardGeometry';
import { segmentsIn } from '@views/slitherlink/lib/boardMarks';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import styles from '@views/slitherlink/ui/BoardLines.module.css';
import { EdgeStroke } from '@views/slitherlink/ui/EdgeStroke';

export function BoardLines() {
  const { edges, boardSize, isSolved } = useSlitherlinkContext();
  const layout = getBoardLayout(boardSize);

  return (
    <g
      aria-hidden="true"
      strokeLinecap="round"
      className={cn('transition-colors duration-500', isSolved ? 'stroke-hint-text' : 'stroke-accent')}
    >
      {segmentsIn(layout, edges, EDGE.LINE).map((segment) => (
        <EdgeStroke key={segment.edge} segment={segment} width={layout.style.lineWidth} className={styles.line} />
      ))}
    </g>
  );
}
