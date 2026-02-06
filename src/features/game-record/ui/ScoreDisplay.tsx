import { ScoreBreakdown } from "@entities/game-record/model/types";
import { formatScore } from "@features/game-record/model/utils/scoreCalculator";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface ScoreRowProps {
  label: string;
  value: number;
  isBonus?: boolean;
  isPenalty?: boolean;
  isBold?: boolean;
}

const ScoreRow = memo<ScoreRowProps>(({ label, value, isBonus, isPenalty, isBold }) => (
  <div className={cn("flex justify-between items-center", isBold && "font-semibold")}>
    <span className="text-slate-600">{label}</span>
    <span
      className={cn(
        "font-tabular",
        isBonus && "text-emerald-600",
        isPenalty && "text-rose-500",
        !isBonus && !isPenalty && "text-slate-800",
      )}
    >
      {value >= 0 && !isPenalty ? "+" : ""}
      {formatScore(value)}
    </span>
  </div>
));

ScoreRow.displayName = "ScoreRow";

interface ScoreDisplayProps {
  breakdown: ScoreBreakdown;
  showDetails?: boolean;
}

export const ScoreDisplay = memo<ScoreDisplayProps>(({ breakdown, showDetails = false }) => {
  const { baseScore, timeBonus, timePenalty, hintPenalty, killerBonus, totalScore } = breakdown;

  return (
    <div className="space-y-3">
      {/* Total Score */}
      <div className="text-center">
        <p className="text-slate-500 text-sm mb-1">획득 점수</p>
        <p
          className={cn(
            "text-4xl font-bold font-tabular",
            "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent",
          )}
        >
          {formatScore(totalScore)}
        </p>
      </div>

      {/* Score Breakdown */}
      {showDetails && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <ScoreRow label="기본 점수" value={baseScore} />
          {timeBonus > 0 && <ScoreRow label="시간 보너스" value={timeBonus} isBonus />}
          {timePenalty > 0 && <ScoreRow label="시간 패널티" value={-timePenalty} isPenalty />}
          {hintPenalty > 0 && <ScoreRow label="힌트 패널티" value={-hintPenalty} isPenalty />}
          {killerBonus > 0 && <ScoreRow label="킬러 모드 보너스" value={killerBonus} isBonus />}
          <div className="border-t border-slate-200 pt-2 mt-2">
            <ScoreRow label="최종 점수" value={totalScore} isBold />
          </div>
        </div>
      )}
    </div>
  );
});

ScoreDisplay.displayName = "ScoreDisplay";
