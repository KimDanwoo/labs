import { WALL_DIRECTIONS } from '@views/walls/config/guide';
import { STEPS } from '@views/walls/lib/grid';
import styles from '@views/walls/ui/WallsGuide.module.css';

interface WallsGuideEdgesProps {
  target: number;
  edges: number[];
  onPick: (edge: number) => void;
}

export function WallsGuideEdges({ target, edges, onPick }: WallsGuideEdgesProps) {
  const steps = STEPS[target] ?? [];

  return (
    <div className={styles.edges} role="group" aria-label="담을 세울 변">
      {steps.map((step, index) => {
        const direction = WALL_DIRECTIONS[index];
        const canPlace = Boolean(step && edges.includes(step.edge));
        return (
          <button
            key={direction}
            type="button"
            aria-label={`${direction}에 담 세우기`}
            disabled={!canPlace}
            onClick={() => {
              if (step) onPick(step.edge);
            }}
          >
            {direction}
          </button>
        );
      })}
    </div>
  );
}
