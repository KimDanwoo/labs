'use client';

import dynamic from 'next/dynamic';

import { BackgroundGlow } from './BackgroundGlow';
import { GameColumn } from './game-board/GameColumn';
import { DesktopControlPanel } from './game-controls/DesktopControlPanel';
import { MobileControlPanel } from './game-controls/MobileControlPanel';
import { HomeHeader } from './HomeHeader';

const GameConfirmSheet = dynamic(() => import('./game-confirm/GameConfirmSheet').then((m) => m.GameConfirmSheet), {
  ssr: false,
});

const GameResultSheet = dynamic(() => import('./game-result/GameResultSheet').then((m) => m.GameResultSheet), {
  ssr: false,
});

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
