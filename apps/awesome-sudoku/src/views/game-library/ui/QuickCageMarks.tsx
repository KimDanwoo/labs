import type { QuickCage } from '@views/game-library/config/quickPuzzle';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface QuickCageMarksProps {
  cage: QuickCage;
}

export function QuickCageMarks({ cage }: QuickCageMarksProps) {
  return (
    <span
      className={styles.cageMarks}
      data-top={cage.top}
      data-right={cage.right}
      data-bottom={cage.bottom}
      data-left={cage.left}
      aria-hidden="true"
    >
      {cage.showsTotal ? <span>{cage.total}</span> : null}
    </span>
  );
}
