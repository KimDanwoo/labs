import { GAMES, type GameId } from '@entities/game-catalog/config/games';
import { GameLayout } from '@shared/ui/game-layout';

interface GameHeadingProps {
  game: GameId;
}

export function GameHeading({ game }: GameHeadingProps) {
  const { name, description } = GAMES[game];

  return (
    <GameLayout.Heading>
      <GameLayout.Title>{name}</GameLayout.Title>
      <GameLayout.Description>{description}</GameLayout.Description>
    </GameLayout.Heading>
  );
}
