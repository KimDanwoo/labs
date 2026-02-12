import { PointResult } from "@entities/game-record/model/types";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface ScoreDisplayProps {
  pointResult: PointResult;
}

export const ScoreDisplay = memo<ScoreDisplayProps>(
  ({ pointResult }) => (
    <div className="space-y-3">
      <div className="text-center">
        <p
          className={cn(
            "text-sm mb-1",
            "text-[rgb(var(--color-text-secondary))]",
          )}
        >
          획득 포인트
        </p>
        <p
          className={cn(
            "text-5xl font-bold font-tabular",
            "bg-gradient-to-r from-amber-500 to-orange-500",
            "bg-clip-text text-transparent",
          )}
        >
          +{pointResult.totalPoint}
        </p>
        {pointResult.killerDeduction > 0 && (
          <p
            className={cn(
              "text-xs mt-1",
              "text-[rgb(var(--color-text-tertiary))]",
            )}
          >
            기본 {pointResult.basePoint}점
            - 킬러 {pointResult.killerDeduction}점
          </p>
        )}
      </div>
    </div>
  ),
);

ScoreDisplay.displayName = "ScoreDisplay";
