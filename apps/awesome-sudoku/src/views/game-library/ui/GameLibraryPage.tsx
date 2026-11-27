import type { ReactNode } from 'react';

import { HomeGames } from '@views/game-library/ui/home/HomeGames';
import { HomeGreeting } from '@views/game-library/ui/home/HomeGreeting';
import { HomeToday } from '@views/game-library/ui/home/HomeToday';
import { HomeTrial } from '@views/game-library/ui/home/HomeTrial';

interface GameLibraryPageProps {
  wallsGuide: ReactNode;
}

export function GameLibraryPage({ wallsGuide }: GameLibraryPageProps) {
  return (
    <main className="mx-auto grid w-full max-w-[1120px] gap-7 px-5 pt-3 pb-14 text-text-primary lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-rows-[453px_auto] xl:grid-rows-[469px_auto] lg:items-start lg:gap-x-8 lg:gap-y-10 lg:px-8 lg:pt-4">
      <div className="grid gap-6 lg:self-center">
        <HomeGreeting />
        <HomeToday />
      </div>
      <HomeTrial wallsGuide={wallsGuide} />
      <HomeGames />
    </main>
  );
}
