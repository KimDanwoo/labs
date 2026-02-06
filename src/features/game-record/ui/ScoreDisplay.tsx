import { ScoreBreakdown } from "@entities/game-record/model/types";
import { formatScore } from "@features/game-record/model/utils/scoreCalculator";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface ScoreDisplayProps {
  breakdown: ScoreBreakdown;
}

export const ScoreDisplay = memo<ScoreDisplayProps>(
  ({ breakdown }) => {
    const { totalScore } = breakdown;

    return (
      <div className="space-y-3">
        <div className="text-center">
          <p
            className={cn(
              "text-sm mb-1",
              "text-[rgb(var(--color-text-secondary))]",
            )}
          >
            획득 점수
          </p>
          <p
            className={cn(
              "text-4xl font-bold font-tabular",
              "bg-gradient-to-r from-amber-500 to-orange-500",
              "bg-clip-text text-transparent",
            )}
          >
            {formatScore(totalScore)}
          </p>
        </div>
      </div>
    );
  },
);

ScoreDisplay.displayName = "ScoreDisplay";
