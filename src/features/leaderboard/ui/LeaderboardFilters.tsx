"use client";

import { GAME_LEVEL, GAME_LEVEL_LABELS, GAME_MODE } from "@entities/game/model/constants";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface LeaderboardFiltersProps {
  difficulty: string;
  gameMode: string;
  onDifficultyChange: (value: string) => void;
  onGameModeChange: (value: string) => void;
}

const difficulties = [
  { value: "", label: "전체" },
  { value: GAME_LEVEL.EASY, label: GAME_LEVEL_LABELS[GAME_LEVEL.EASY] },
  { value: GAME_LEVEL.MEDIUM, label: GAME_LEVEL_LABELS[GAME_LEVEL.MEDIUM] },
  { value: GAME_LEVEL.HARD, label: GAME_LEVEL_LABELS[GAME_LEVEL.HARD] },
  { value: GAME_LEVEL.EXPERT, label: GAME_LEVEL_LABELS[GAME_LEVEL.EXPERT] },
];

const gameModes = [
  { value: "", label: "전체" },
  { value: GAME_MODE.CLASSIC, label: "클래식" },
  { value: GAME_MODE.KILLER, label: "킬러" },
];

export const LeaderboardFilters = memo<LeaderboardFiltersProps>(
  ({ difficulty, gameMode, onDifficultyChange, onGameModeChange }) => (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Difficulty Filter */}
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-[rgb(var(--color-text-secondary))] mb-1.5">난이도</label>
        <div className="flex flex-wrap gap-1.5">
          {difficulties.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onDifficultyChange(d.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-all",
                difficulty === d.value
                  ? "bg-[rgb(var(--color-accent))] text-white shadow-sm"
                  : "bg-[rgb(var(--color-bg-tertiary))]"
                    + " text-[rgb(var(--color-text-secondary))]"
                    + " hover:bg-[rgb(var(--color-hover))]",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game Mode Filter */}
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-[rgb(var(--color-text-secondary))] mb-1.5">모드</label>
        <div className="flex flex-wrap gap-1.5">
          {gameModes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onGameModeChange(m.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-all",
                gameMode === m.value
                  ? "bg-[rgb(var(--color-accent))] text-white shadow-sm"
                  : "bg-[rgb(var(--color-bg-tertiary))]"
                    + " text-[rgb(var(--color-text-secondary))]"
                    + " hover:bg-[rgb(var(--color-hover))]",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ),
);

LeaderboardFilters.displayName = "LeaderboardFilters";
