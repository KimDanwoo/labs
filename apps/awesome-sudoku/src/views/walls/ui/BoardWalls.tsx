import { cn } from '@shared/lib/cn';
import { BOARD_VIEW } from '@views/walls/config/boardView';
import { edgeLine } from '@views/walls/lib/edgeGeometry';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';
import styles from '@views/walls/ui/BoardWalls.module.css';

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
            pathLength={1}
            className={cn(styles.wall, index === walls.length - 1 ? 'stroke-primary' : 'stroke-text-tertiary')}
          />
        ))}
      </g>
    </svg>
  );
}
