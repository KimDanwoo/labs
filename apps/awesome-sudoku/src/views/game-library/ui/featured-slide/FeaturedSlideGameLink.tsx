import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

import { FULL_GAME_LINK_TEXT } from '@views/game-library/config/featuredSlides';
import { useFeaturedGameContext } from '@views/game-library/model/hooks/useFeaturedGameContext';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface FeaturedSlideGameLinkProps {
  variant?: 'hint' | 'victory';
}

export function FeaturedSlideGameLink({ variant = 'hint' }: FeaturedSlideGameLinkProps) {
  const game = useFeaturedGameContext();

  return (
    <Link href={game.href} className={styles.gameLink} data-variant={variant}>
      {game.name} {FULL_GAME_LINK_TEXT}
      <LuArrowRight aria-hidden="true" />
    </Link>
  );
}
