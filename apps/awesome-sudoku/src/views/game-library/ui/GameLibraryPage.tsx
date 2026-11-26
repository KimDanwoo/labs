import type { ReactNode } from 'react';

import { FeaturedPuzzle } from '@views/game-library/ui/FeaturedPuzzle';
import { GameGrid } from '@views/game-library/ui/GameGrid';

interface GameLibraryPageProps {
  wallsGuide: ReactNode;
}

export function GameLibraryPage({ wallsGuide }: GameLibraryPageProps) {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-surface-primary text-text-primary">
      <div className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8 sm:pb-16">
        <FeaturedPuzzle wallsGuide={wallsGuide} />
        <GameGrid />
      </div>
    </main>
  );
}
