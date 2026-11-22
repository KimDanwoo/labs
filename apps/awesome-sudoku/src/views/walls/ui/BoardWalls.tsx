import { BOARD_VIEW } from '@views/walls/config/boardView';
import { edgeLine } from '@views/walls/lib/edgeGeometry';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function BoardWalls() {
  const { walls } = useWallsContext();

  return (
    <svg
      aria-hidden="true"
      viewBox={BOARD_VIEW.viewBox}
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <g strokeWidth={BOARD_VIEW.wallWidth} strokeLinecap="round">
        {walls.map((edge, index) => (
          <line
            key={edge}
            {...edgeLine(edge)}
            className={index === walls.length - 1 ? 'stroke-white' : 'stroke-goban-line'}
          />
        ))}
      </g>
    </svg>
  );
}
