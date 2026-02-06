"use client";

import { GameRecord } from "@entities/game-record/model/types";
import { GAME_LEVEL_LABELS, GAME_MODE } from "@entities/game/model/constants";
import {
  calculateScore,
  formatScore,
} from "@features/game-record/model/utils/scoreCalculator";
import { formatTime } from "@features/sudoku-game/model/utils";
import { cn } from "@shared/model/utils";
import { memo, useState } from "react";

interface RecentGamesProps {
  games: GameRecord[];
  isLoading: boolean;
  error?: Error | null;
}

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div
      className={cn(
        "animate-spin w-6 h-6 border-2",
        "border-[rgb(var(--color-accent))]",
        "border-t-transparent rounded-full",
      )}
    />
  </div>
);

const EmptyState = () => (
  <div
    className={cn(
      "text-center py-12",
      "text-[rgb(var(--color-text-secondary))]",
    )}
  >
    <p>아직 완료한 게임이 없습니다.</p>
    <p className="text-sm mt-1">
      게임을 완료하면 여기에 표시됩니다.
    </p>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div
    className={cn(
      "text-center py-12",
      "text-[rgb(var(--color-error-text))]",
    )}
  >
    <p>데이터를 불러오지 못했습니다.</p>
    <p className="text-sm mt-1">{message}</p>
  </div>
);

interface ScoreDetailProps {
  game: GameRecord;
}

const ScoreDetail = memo<ScoreDetailProps>(({ game }) => {
  const breakdown = calculateScore({
    difficulty: game.difficulty,
    gameMode: game.gameMode,
    completionTime: game.completionTime,
    hintsUsed: game.hintsUsed,
    mistakeCount: game.mistakesCount ?? 0,
  });

  const rows = [
    { label: "기본 점수", value: breakdown.baseScore },
    ...(breakdown.timePenalty > 0
      ? [{ label: "시간 감점", value: -breakdown.timePenalty, isPenalty: true }]
      : []),
    ...(breakdown.hintPenalty > 0
      ? [{ label: "힌트 감점", value: -breakdown.hintPenalty, isPenalty: true }]
      : []),
    ...(breakdown.mistakePenalty > 0
      ? [{ label: "오답 감점", value: -breakdown.mistakePenalty, isPenalty: true }]
      : []),
    ...(breakdown.killerBonus > 0
      ? [{ label: "킬러 보너스", value: breakdown.killerBonus, isBonus: true }]
      : []),
  ];

  return (
    <div
      className={cn(
        "mx-4 mb-3 p-3 rounded-lg text-xs",
        "bg-[rgb(var(--color-bg-tertiary))]",
      )}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between py-0.5"
        >
          <span className="text-[rgb(var(--color-text-secondary))]">
            {row.label}
          </span>
          <span
            className={cn(
              "font-tabular",
              row.isBonus && "text-[rgb(var(--color-success-text))]",
              row.isPenalty && "text-[rgb(var(--color-error-text))]",
              !row.isBonus && !row.isPenalty && "text-[rgb(var(--color-text-primary))]",
            )}
          >
            {row.value >= 0 && !row.isPenalty ? "+" : ""}
            {formatScore(row.value)}
          </span>
        </div>
      ))}
      <div
        className={cn(
          "flex justify-between pt-1.5 mt-1.5",
          "border-t border-[rgb(var(--color-border-light))]",
          "font-semibold",
        )}
      >
        <span className="text-[rgb(var(--color-text-secondary))]">
          최종 점수
        </span>
        <span className="text-[rgb(var(--color-text-primary))] font-tabular">
          {formatScore(breakdown.totalScore)}
        </span>
      </div>
    </div>
  );
});

ScoreDetail.displayName = "ScoreDetail";

export const RecentGames = memo<RecentGamesProps>(
  ({ games, isLoading, error }) => {
    const [expandedId, setExpandedId] = useState<string | null>(
      null,
    );

    const renderContent = () => {
      if (isLoading) return <LoadingState />;
      if (error) return <ErrorState message={error.message} />;
      if (games.length === 0) return <EmptyState />;

      return (
        <div
          className={cn(
            "divide-y",
            "divide-[rgb(var(--color-divider))]",
          )}
        >
          {games.map((game) => {
            const diffLabel =
              GAME_LEVEL_LABELS[
                game.difficulty as keyof typeof GAME_LEVEL_LABELS
              ] || game.difficulty;
            const isKiller =
              game.gameMode === GAME_MODE.KILLER;
            const isExpanded = expandedId === game.id;
            const mistakes = game.mistakesCount ?? 0;

            return (
              <div key={game.id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : game.id!)
                  }
                  className={cn(
                    "w-full px-4 py-3",
                    "hover:bg-[rgb(var(--color-hover))]",
                    "transition-colors",
                    "flex items-center gap-4",
                    "text-left",
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex-shrink-0",
                      "flex items-center justify-center",
                      "bg-[rgb(var(--color-success-bg))]",
                      "text-[rgb(var(--color-success-text))]",
                    )}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium",
                          "text-[rgb(var(--color-text-primary))]",
                        )}
                      >
                        {diffLabel}
                      </span>
                      {isKiller && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            "bg-[rgb(var(--color-error-bg))]",
                            "text-[rgb(var(--color-error-text))]",
                          )}
                        >
                          킬러
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        "text-[rgb(var(--color-text-secondary))]",
                      )}
                    >
                      {formatTime(game.completionTime)}
                      {" · "}힌트 {game.hintsUsed}회
                      {mistakes > 0 && ` · 오답 ${mistakes}회`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "font-bold font-tabular",
                        "text-[rgb(var(--color-text-primary))]",
                      )}
                    >
                      {formatScore(game.score)}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        "text-[rgb(var(--color-text-tertiary))]",
                      )}
                    >
                      {game.createdAt?.toDate?.()
                        ? new Date(
                          game.createdAt.toDate(),
                        ).toLocaleDateString("ko-KR")
                        : "-"}
                    </p>
                  </div>
                </button>

                {isExpanded && <ScoreDetail game={game} />}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div
        className={cn(
          "bg-[rgb(var(--color-surface-primary))]",
          "rounded-2xl shadow-sm",
          "border border-[rgb(var(--color-border-light))]",
          "overflow-hidden",
        )}
      >
        <div
          className={cn(
            "px-4 py-3 border-b",
            "border-[rgb(var(--color-border-light))]",
          )}
        >
          <h3
            className={cn(
              "font-semibold",
              "text-[rgb(var(--color-text-primary))]",
            )}
          >
            최근 게임
          </h3>
        </div>
        {renderContent()}
      </div>
    );
  },
);

RecentGames.displayName = "RecentGames";
