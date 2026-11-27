import type { ShelfGame } from '@entities/game-catalog';
import { ButtonFace } from '@shared/ui/button';
import { IconCircle } from '@shared/ui/icon-circle';
import { ListRow } from '@shared/ui/list-row';
import { GAME_LIST_TEXT } from '@views/game-library/config/homeCopy';
import { GameGlyph } from '@views/game-library/ui/GameGlyph';

interface HomeGameRowProps {
  game: ShelfGame;
}

export function HomeGameRow({ game }: HomeGameRowProps) {
  return (
    <ListRow.Root href={game.href}>
      <IconCircle>
        <GameGlyph id={game.id} />
      </IconCircle>
      <ListRow.Body>
        <ListRow.Title>{game.name}</ListRow.Title>
        <ListRow.Description>{game.description}</ListRow.Description>
      </ListRow.Body>
      <ButtonFace variant="weak" size="s" aria-hidden="true">
        {GAME_LIST_TEXT.start}
      </ButtonFace>
    </ListRow.Root>
  );
}
