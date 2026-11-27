import type { GameId } from '@entities/game-catalog';
import { GAME_GLYPHS } from '@views/game-library/config/gameGlyphs';

interface GameGlyphProps {
  id: GameId;
}

export function GameGlyph({ id }: GameGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GAME_GLYPHS[id].map(({ tag: Shape, attrs }, index) => (
        <Shape key={`${id}-${index}`} {...attrs} />
      ))}
    </svg>
  );
}
