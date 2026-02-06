import { formatTime } from "@features/sudoku-game/model/utils";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useSaveGameRecord } from "@features/game-record/model/hooks/useSaveGameRecord";
import { ScoreDisplay } from "@features/game-record/ui/ScoreDisplay";
import { cn } from "@shared/model/utils";
import { useEffect, useRef } from "react";

export const CompletedBoard = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);
  const currentTime = useSudokuStore((state) => state.currentTime);

  const { save, isSaving, scoreBreakdown } = useSaveGameRecord();
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (isCompleted && isSuccess) {
      saveRef.current();
    }
  }, [isCompleted, isSuccess]);

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
          <h2
            className={cn(
              "text-2xl font-bold mb-2",
              "text-[rgb(var(--color-text-primary))]",
            )}
          >
            축하합니다!
          </h2>

          {/* Time */}
          <p
            className={cn(
              "text-sm mb-1",
              "text-[rgb(var(--color-text-secondary))]",
            )}
          >
            완료 시간
          </p>
          <p
            className={cn(
              "text-3xl font-mono font-bold font-tabular mb-4",
              "text-[rgb(var(--color-text-primary))]",
            )}
          >
            {formatTime(currentTime)}
          </p>

          {/* Score Display */}
          {scoreBreakdown && (
            <div className="mt-4">
              <ScoreDisplay breakdown={scoreBreakdown} />
            </div>
          )}

          {/* Saving indicator */}
          {isSaving && (
            <p
              className={cn(
                "mt-2 text-xs animate-pulse",
                "text-[rgb(var(--color-text-tertiary))]",
              )}
            >
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
          <h2
            className={cn(
              "text-2xl font-bold mb-2",
              "text-[rgb(var(--color-text-primary))]",
            )}
          >
            아쉽네요
          </h2>

          {/* Message */}
          <p className="text-[rgb(var(--color-text-secondary))]">
            일부 셀의 값이 올바르지 않습니다.
            <br />
            다시 시도해보세요!
          </p>
        </>
      )}
    </div>
  );
};
