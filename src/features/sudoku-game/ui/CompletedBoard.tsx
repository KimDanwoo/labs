import { formatTime } from "@features/sudoku-game/model/utils";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";

export const CompletedBoard = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);
  const currentTime = useSudokuStore((state) => state.currentTime);

  if (!isCompleted) return null;

  return (
    <div className="text-center">
      {isSuccess ? (
        <>
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(52,199,89)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[rgb(52,199,89)]"
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

          {/* Title */}
          <h2 className="text-2xl font-semibold text-[rgb(28,28,30)] mb-2">
            Congratulations!
          </h2>

          {/* Time */}
          <p className="text-[rgb(99,99,102)] mb-1">
            Completed in
          </p>
          <p className="text-3xl font-mono font-medium text-[rgb(28,28,30)] font-tabular">
            {formatTime(currentTime)}
          </p>
        </>
      ) : (
        <>
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(255,59,48)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[rgb(255,59,48)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-[rgb(28,28,30)] mb-2">
            Not Quite Right
          </h2>

          {/* Message */}
          <p className={cn("text-[rgb(99,99,102)]")}>
            Some cells have incorrect values.
            <br />
            Try again!
          </p>
        </>
      )}
    </div>
  );
};
