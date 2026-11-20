import { getBoardLayout } from '@views/slitherlink/lib/boardGeometry';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';

export function BoardDots() {
  const { boardSize } = useSlitherlinkContext();
  const { dots, style } = getBoardLayout(boardSize);

  return (
    <g className="fill-text-tertiary">
      {dots.map((dot, vertex) => (
        <circle key={vertex} cx={dot.x} cy={dot.y} r={style.dotRadius} />
      ))}
    </g>
  );
}
