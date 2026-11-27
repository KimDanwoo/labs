import { Badge } from '@shared/ui/badge';
import { ButtonLink } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { IconCircle } from '@shared/ui/icon-circle';
import { TODAY_GAME_ID, TODAY_TEXT } from '@views/game-library/config/homeCopy';
import { findShelfGame } from '@views/game-library/lib/findShelfGame';
import { GameGlyph } from '@views/game-library/ui/GameGlyph';

export function HomeToday() {
  const game = findShelfGame(TODAY_GAME_ID);

  return (
    <section aria-labelledby="home-today-title">
      <Card tone="lemon" className="grid gap-[18px] pt-[22px] lg:p-[26px] lg:pb-6">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="ink">{TODAY_TEXT.badge}</Badge>
          <span className="text-[13px] font-semibold text-on-lemon-muted">{TODAY_TEXT.meta}</span>
        </div>
        <div className="flex items-center gap-3.5">
          <IconCircle size="l" tone="ink">
            <GameGlyph id={game.id} />
          </IconCircle>
          <div className="min-w-0">
            <h2 id="home-today-title" className="text-[22px] leading-[1.4] font-extrabold tracking-[-0.03em]">
              {game.name}
            </h2>
            <p className="mt-0.5 text-[15px] leading-normal text-on-lemon-muted">{game.description}</p>
          </div>
        </div>
        <ButtonLink href={game.href} variant="ink" size="xl" isFull className="focus-visible:outline-ink">
          {TODAY_TEXT.cta}
        </ButtonLink>
      </Card>
    </section>
  );
}
