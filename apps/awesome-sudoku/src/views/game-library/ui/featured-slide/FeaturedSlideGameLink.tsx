'use client';

import { LuArrowRight } from 'react-icons/lu';

import { ButtonLink } from '@shared/ui/button';
import { FULL_GAME_LINK_TEXT } from '@views/game-library/config/featuredSlides';
import { useFeaturedGameContext } from '@views/game-library/model/hooks/useFeaturedGameContext';
import styles from '@views/game-library/ui/GameLibrary.module.css';

export function FeaturedSlideGameLink() {
  const { game } = useFeaturedGameContext();

  return (
    <ButtonLink href={game.href} size="l" isFull className={styles.slideCta}>
      {game.name} {FULL_GAME_LINK_TEXT}
      <LuArrowRight aria-hidden="true" />
    </ButtonLink>
  );
}
