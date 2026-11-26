import { GameLibraryPage } from '@views/game-library';
import { WallsGuide } from '@views/walls';

export default function HomePage() {
  return <GameLibraryPage wallsGuide={<WallsGuide />} />;
}
