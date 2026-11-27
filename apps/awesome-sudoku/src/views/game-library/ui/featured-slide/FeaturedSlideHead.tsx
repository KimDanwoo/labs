'use client';

import { cn } from '@shared/lib/cn';
import { IconCircle } from '@shared/ui/icon-circle';
import { useFeaturedGameContext } from '@views/game-library/model/hooks/useFeaturedGameContext';
import { GameGlyph } from '@views/game-library/ui/GameGlyph';
import styles from '@views/game-library/ui/GameLibrary.module.css';

export function FeaturedSlideHead() {
  const { game, slide } = useFeaturedGameContext();

  return (
    <div className={styles.slideHead}>
      <IconCircle className="lg:hidden">
        <GameGlyph id={game.id} />
      </IconCircle>
      <div className="min-w-0 flex-1">
        <h3 className="text-xl leading-[1.4] font-extrabold tracking-[-0.03em]">{slide.title}</h3>
        <p className={cn(styles.slideHint, 'text-sm leading-normal text-text-secondary')}>{slide.hint}</p>
      </div>
    </div>
  );
}
