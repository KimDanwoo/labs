'use client';

import dynamic from 'next/dynamic';

import { BackgroundGlow } from '@views/home/ui/BackgroundGlow';
import { GameColumn } from '@views/home/ui/game-board/GameColumn';
import { DesktopControlPanel } from '@views/home/ui/game-controls/DesktopControlPanel';
import { MobileControlPanel } from '@views/home/ui/game-controls/MobileControlPanel';
import { HomeHeader } from '@views/home/ui/HomeHeader';

const GameConfirmSheet = dynamic(
  () => import('@views/home/ui/game-confirm/GameConfirmSheet').then((m) => m.GameConfirmSheet),
  {
    ssr: false,
  },
);

const GameResultSheet = dynamic(
  () => import('@views/home/ui/game-result/GameResultSheet').then((m) => m.GameResultSheet),
  {
    ssr: false,
  },
);

export const HomePage = () => (
  <main className="min-h-svh min-w-[360px] bg-surface-secondary relative overflow-x-hidden">
    <BackgroundGlow />
    <HomeHeader />
    <div className="relative mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="flex flex-col items-center lg:grid lg:grid-cols-[auto_auto] lg:justify-center lg:items-start lg:gap-12">
        <GameColumn />
        <DesktopControlPanel />
        <MobileControlPanel />
      </div>
    </div>
    <GameResultSheet />
    <GameConfirmSheet />
  </main>
);
