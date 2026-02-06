"use client";

import { UserProfileMenu } from "@entities/auth/ui";
import { GameModeSelector, SelectNumber, NewGameButton } from "@features/sudoku-game/ui";
import { SudokuBoard } from "@widgets/game-board/ui";
import { Controls } from "@widgets/game-controls/ui";
import { GameStatus } from "@widgets/game-header/ui";
import { CompleteGameOverlay, PauseGameOverlay } from "@widgets/game-overlays/ui";

export const HomePage = () => (
  <main className="min-h-svh min-w-[320px] bg-[#f8fafc] relative overflow-x-hidden">
    {/* Ambient background */}
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
    </div>

    {/* Nav */}
    <nav className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <GameModeSelector />
        <UserProfileMenu />
      </div>
    </nav>

    {/* Main content */}
    <div className="relative max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      {/* Mobile/Tablet: single column, Desktop: 2 columns with grid */}
      <div
        className={
          "flex flex-col items-center " +
          "lg:grid lg:grid-cols-[auto_auto] lg:justify-center lg:items-start lg:gap-12"
        }
      >
        {/* Left: Header + Board */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-4">
            <GameStatus />
          </div>
          <div className="relative">
            <CompleteGameOverlay />
            <PauseGameOverlay />
            <SudokuBoard />
          </div>
        </div>

        {/* Right: Control Panel (Desktop only) */}
        <div className="hidden lg:flex flex-col pt-[52px]">
          <div
            className={
              "bg-white/60 backdrop-blur-sm rounded-2xl " +
              "shadow-[0_8px_32px_rgba(0,0,0,0.08)] " +
              "ring-1 ring-white/80 " +
              "w-[432px] xl:w-[504px] " +
              "h-[432px] xl:h-[504px] " +
              "p-5 " +
              "flex flex-col gap-4"
            }
          >
            <Controls />
            <div className="flex-1">
              <SelectNumber />
            </div>
            <NewGameButton />
          </div>
        </div>

        {/* Mobile/Tablet controls */}
        <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
          <Controls />
          <SelectNumber />
          <NewGameButton />
        </div>
      </div>
    </div>
  </main>
);
