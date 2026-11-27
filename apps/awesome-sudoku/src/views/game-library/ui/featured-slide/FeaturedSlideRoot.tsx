'use client';

import type { ReactNode } from 'react';

import { Card } from '@shared/ui/card';
import { VictoryActionContext } from '@shared/ui/puzzle-victory';
import type { TrialSlide } from '@views/game-library/config/featuredSlides';
import { findShelfGame } from '@views/game-library/lib/findShelfGame';
import { trialPanelId, trialTabId } from '@views/game-library/lib/trialIds';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';
import { FeaturedGameContext } from '@views/game-library/model/store/featuredGameContext';
import { FeaturedSlideVictoryLink } from '@views/game-library/ui/featured-slide/FeaturedSlideVictoryLink';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface FeaturedSlideRootProps {
  slide: TrialSlide;
  isHidden: boolean;
  children: ReactNode;
}

export function FeaturedSlideRoot({ slide, isHidden, children }: FeaturedSlideRootProps) {
  const { baseId } = useTrialContext();
  const game = findShelfGame(slide.id);

  return (
    <article
      id={trialPanelId(baseId, slide.id)}
      role="tabpanel"
      aria-labelledby={trialTabId(baseId, slide.id)}
      hidden={isHidden}
    >
      <FeaturedGameContext.Provider value={{ game, slide }}>
        <VictoryActionContext.Provider value={<FeaturedSlideVictoryLink />}>
          <Card className={styles.slide}>{children}</Card>
        </VictoryActionContext.Provider>
      </FeaturedGameContext.Provider>
    </article>
  );
}
