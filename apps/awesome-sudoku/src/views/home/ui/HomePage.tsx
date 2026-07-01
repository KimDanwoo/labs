"use client";

import { UserProfileMenu } from "@entities/auth/ui";
import { GameModeSelector, SelectNumber } from "@features/sudoku-game/ui";
import { ThemeToggle } from "@features/theme/ui/ThemeToggle";
import { cn } from "@shared/model/utils";
import { SudokuBoard } from "@widgets/game-board/ui";
import { Controls } from "@widgets/game-controls/ui";
import { GameStatus } from "@widgets/game-header/ui";
import dynamic from "next/dynamic";

const PauseGameOverlay = dynamic(
  () => import("@widgets/game-overlays/ui/PauseGameOverlay"),
  { ssr: false },
);
const GameResultSheet = dynamic(
  () => import("@features/sudoku-game/ui/GameResultSheet").then(
    (m) => m.GameResultSheet,
  ),
  { ssr: false },
);

export const HomePage = () => (
  <main
    className={cn(
      "min-h-svh min-w-[360px]",
      "bg-[rgb(var(--color-surface-secondary))]",
      "relative overflow-x-hidden",
    )}
  >
    {/* Ambient background */}
    <div className="fixed inset-0 pointer-events-none">
      <div
        className={cn(
          "absolute top-0 left-1/4 w-96 h-96",
          "bg-blue-200/30 dark:bg-blue-800/10",
          "rounded-full blur-3xl",
        )}
      />
      <div
        className={cn(
          "absolute bottom-1/4 right-1/4 w-80 h-80",
          "bg-indigo-200/20 dark:bg-indigo-800/8",
          "rounded-full blur-3xl",
        )}
      />
      <div
        className={cn(
          "absolute top-1/2 left-1/2 w-64 h-64",
          "bg-purple-200/20 dark:bg-purple-800/8",
          "rounded-full blur-3xl",
        )}
      />
    </div>

    {/* Header */}
    <header
      className={cn(
        "sticky top-0 z-30 backdrop-blur-xl",
        "bg-[rgb(var(--color-glass))]/[var(--glass-opacity)]",
        "border-b border-[rgb(var(--color-border-light))]/50",
      )}
    >
      <div
        className={cn(
          "mx-auto py-3",
          "flex items-center justify-between",
          "w-full max-w-[360px]",
          "lg:max-w-[912px] xl:max-w-[1056px]",
        )}
      >
        <GameModeSelector />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserProfileMenu />
        </div>
      </div>
    </header>

    {/* Main content */}
    <div className="relative mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div
        className={cn(
          "flex flex-col items-center",
          "lg:grid lg:grid-cols-[auto_auto]",
          "lg:justify-center lg:items-start lg:gap-12",
        )}
      >
        {/* Left: Header + Board */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-4">
            <GameStatus />
          </div>
          <div className="relative">
            <PauseGameOverlay />
            <SudokuBoard />
          </div>
        </div>

        {/* Right: Control Panel (Desktop only) */}
        <div className="hidden lg:flex flex-col pt-[52px]">
          <div
            className={cn(
              "bg-[rgb(var(--color-glass))]/60",
              "dark:bg-[rgb(var(--color-glass))]/70",
              "backdrop-blur-sm rounded-2xl",
              "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
              "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
              "ring-1",
              "ring-[rgb(var(--color-surface-primary))]/80",
              "dark:ring-white/5",
              "w-[432px] xl:w-[504px]",
              "h-[432px] xl:h-[504px]",
              "p-5",
              "flex flex-col gap-4",
            )}
          >
            <Controls />
            <div className="flex-1">
              <SelectNumber />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet controls */}
        <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
          <Controls />
          <SelectNumber />
        </div>
      </div>
    </div>

    {/* Game Result Bottom Sheet */}
    <GameResultSheet />
  </main>
);
