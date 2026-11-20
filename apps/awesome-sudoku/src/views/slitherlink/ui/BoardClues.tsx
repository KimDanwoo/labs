import { getBoardLayout } from '@views/slitherlink/lib/boardGeometry';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';

export function BoardClues() {
  const { puzzle, boardSize } = useSlitherlinkContext();
  const { cellCenters, style } = getBoardLayout(boardSize);

  return (
    <g aria-hidden="true" className="fill-text-primary font-semibold font-tabular" fontSize={style.clueFontSize}>
      {puzzle?.clues.map((clue, cell) =>
        clue === null ? null : (
          <text
            key={cell}
            x={cellCenters[cell]?.x}
            y={cellCenters[cell]?.y}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {clue}
          </text>
        ),
      )}
    </g>
  );
}
