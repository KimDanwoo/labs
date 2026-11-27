'use client';

import { useFeaturedGameContext } from '@views/game-library/model/hooks/useFeaturedGameContext';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';
import styles from '@views/game-library/ui/GameLibrary.module.css';

export function FeaturedSlidePlay() {
  const { slide } = useFeaturedGameContext();
  const { wallsGuide } = useTrialContext();

  return <div className={styles.slidePlay}>{'Play' in slide ? <slide.Play /> : wallsGuide}</div>;
}
