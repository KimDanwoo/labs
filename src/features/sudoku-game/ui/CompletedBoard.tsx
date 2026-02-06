import { formatTime } from "@features/sudoku-game/model/utils";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useSaveGameRecord } from "@features/game-record/model/hooks/useSaveGameRecord";
import { ScoreDisplay } from "@features/game-record/ui/ScoreDisplay";
import { cn } from "@shared/model/utils";
import { useEffect, useRef, useState } from "react";

export const CompletedBoard = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);
  const currentTime = useSudokuStore((state) => state.currentTime);

  const { save, isSaving, scoreBreakdown } = useSaveGameRecord();
  const [showDetails, setShowDetails] = useState(false);
  const hasSaved = useRef(false);

  useEffect(() => {
    if (isCompleted && isSuccess && !hasSaved.current) {
      hasSaved.current = true;
      save();
    }
  }, [isCompleted, isSuccess, save]);

  useEffect(() => {
    if (!isCompleted) {
      hasSaved.current = false;
    }
  }, [isCompleted]);

  if (!isCompleted) return null;

  return (
    <div className="text-center">
      {isSuccess ? (
        <>
          {/* Success Icon */}
          <div
            className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full",
              "bg-gradient-to-b from-emerald-400 to-emerald-500",
              "shadow-[0_8px_24px_rgba(16,185,129,0.3)]",
              "flex items-center justify-center",
            )}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            축하합니다!
          </h2>

          {/* Time */}
          <p className="text-slate-500 text-sm mb-1">완료 시간</p>
          <p className="text-3xl font-mono font-bold text-slate-800 font-tabular mb-4">
            {formatTime(currentTime)}
          </p>

          {/* Score Display */}
          {scoreBreakdown && (
            <div className="mt-4">
              <ScoreDisplay breakdown={scoreBreakdown} showDetails={showDetails} />
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className={cn(
                  "mt-3 text-sm text-slate-500 hover:text-slate-700",
                  "transition-colors underline underline-offset-2",
                )}
              >
                {showDetails ? "상세 숨기기" : "점수 상세 보기"}
              </button>
            </div>
          )}

          {/* Saving indicator */}
          {isSaving && (
            <p className="mt-2 text-xs text-slate-400 animate-pulse">
              기록 저장 중...
            </p>
          )}
        </>
      ) : (
        <>
          {/* Error Icon */}
          <div
            className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full",
              "bg-gradient-to-b from-rose-400 to-rose-500",
              "shadow-[0_8px_24px_rgba(244,63,94,0.3)]",
              "flex items-center justify-center",
            )}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            아쉽네요
          </h2>

          {/* Message */}
          <p className="text-slate-500">
            일부 셀의 값이 올바르지 않습니다.
            <br />
            다시 시도해보세요!
          </p>
        </>
      )}
    </div>
  );
};
