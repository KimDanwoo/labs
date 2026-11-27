'use client';

import styles from '@views/game-library/ui/GameLibrary.module.css';
import { TrialCount } from '@views/game-library/ui/trial/TrialCount';
import { TrialStepButton } from '@views/game-library/ui/trial/TrialStepButton';

export function FeaturedSlidePager() {
  return (
    <div className={styles.slidePager}>
      <TrialStepButton step={-1} />
      <TrialCount />
      <TrialStepButton step={1} />
    </div>
  );
}
