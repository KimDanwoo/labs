import type { ReactNode } from 'react';

import type { SLIDES } from '@views/game-library/config/featuredSlides';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface FeaturedSlideContentProps {
  slide: (typeof SLIDES)[number];
  wallsGuide: ReactNode;
}

export function FeaturedSlideContent({ slide, wallsGuide }: FeaturedSlideContentProps) {
  if ('Play' in slide) return <slide.Play />;
  return <div className={styles.guidedGame}>{wallsGuide}</div>;
}
