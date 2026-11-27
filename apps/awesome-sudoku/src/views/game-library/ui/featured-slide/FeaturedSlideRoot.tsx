'use client';

import type { ReactNode } from 'react';

import type { GameId } from '@entities/game-catalog';
import { VictoryActionContext } from '@shared/ui/puzzle-victory';
import { findShelfGame } from '@views/game-library/lib/findShelfGame';
import { FeaturedGameContext } from '@views/game-library/model/store/featuredGameContext';
import { FeaturedSlideGameLink } from '@views/game-library/ui/featured-slide/FeaturedSlideGameLink';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface FeaturedSlideRootProps {
  gameId: GameId;
  isHidden: boolean;
  children: ReactNode;
}

export function FeaturedSlideRoot({ gameId, isHidden, children }: FeaturedSlideRootProps) {
  const game = findShelfGame(gameId);

  return (
    <article className={styles.slide} hidden={isHidden}>
      <FeaturedGameContext.Provider value={game}>
        <VictoryActionContext.Provider value={<FeaturedSlideGameLink variant="victory" />}>
          {children}
        </VictoryActionContext.Provider>
      </FeaturedGameContext.Provider>
    </article>
  );
}
