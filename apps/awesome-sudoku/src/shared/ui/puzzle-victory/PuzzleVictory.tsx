'use client';

import { useState } from 'react';
import { LuTrophy } from 'react-icons/lu';

import styles from '@shared/ui/puzzle-victory/PuzzleVictory.module.css';

export function PuzzleVictory() {
  const [isCelebrating, setIsCelebrating] = useState(true);

  function handleCelebrationEnd(): void {
    setIsCelebrating(false);
  }

  return (
    <span className={styles.victory}>
      <LuTrophy aria-hidden="true" />
      승리했어요!
      {isCelebrating ? (
        <span className={styles.victoryEffect} aria-hidden="true" onAnimationEnd={handleCelebrationEnd} />
      ) : null}
    </span>
  );
}
