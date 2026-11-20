import { cn } from '@shared/lib/cn';
import { LOADER_GRID } from '@views/slitherlink/config/loader';
import { LOADER_SPAN, loaderDots, loaderLoopPath } from '@views/slitherlink/lib/loaderGeometry';
import styles from '@views/slitherlink/ui/LoopLoader.module.css';

export function LoopLoader() {
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${LOADER_SPAN} ${LOADER_SPAN}`} className="size-20">
      <g className={cn(styles.dots, 'fill-text-tertiary')}>
        {loaderDots().map((dot) => (
          <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={LOADER_GRID.dotRadius} />
        ))}
      </g>
      <path
        d={loaderLoopPath()}
        pathLength={1}
        fill="none"
        strokeWidth={LOADER_GRID.lineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(styles.loop, 'stroke-accent')}
      />
    </svg>
  );
}
