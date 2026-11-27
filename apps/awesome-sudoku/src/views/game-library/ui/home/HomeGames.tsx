import { GAME_SHELF } from '@entities/game-catalog';
import { Badge } from '@shared/ui/badge';
import { GAME_LIST_TEXT } from '@views/game-library/config/homeCopy';
import { HomeGameRow } from '@views/game-library/ui/home/HomeGameRow';

export function HomeGames() {
  return (
    <section aria-labelledby="home-games-title" className="lg:col-span-2">
      <h2
        id="home-games-title"
        className="mb-2 flex items-center gap-2 text-xl leading-[1.45] font-extrabold tracking-[-0.03em]"
      >
        {GAME_LIST_TEXT.title}
        <Badge>{GAME_SHELF.length}</Badge>
      </h2>
      <ul className="grid lg:grid-cols-2 lg:gap-x-8">
        {GAME_SHELF.map((game) => (
          <li key={game.href}>
            <HomeGameRow game={game} />
          </li>
        ))}
      </ul>
    </section>
  );
}
