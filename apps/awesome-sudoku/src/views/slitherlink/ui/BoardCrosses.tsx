import { cn } from '@shared/lib/cn';
import { CROSS_WIDTH } from '@views/slitherlink/config/boardView';
import { getBoardLayout } from '@views/slitherlink/lib/boardGeometry';
import { crossesPath } from '@views/slitherlink/lib/boardMarks';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';

export function BoardCrosses() {
  const { edges, boardSize, isSolved } = useSlitherlinkContext();
  const path = crossesPath(getBoardLayout(boardSize), edges);

  return (
    <path
      d={path}
      fill="none"
      strokeWidth={CROSS_WIDTH}
      strokeLinecap="round"
      className={cn('stroke-text-tertiary transition-opacity duration-500', isSolved && 'opacity-0')}
    />
  );
}
