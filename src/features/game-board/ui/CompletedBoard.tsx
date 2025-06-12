import { useSudokuStore } from "@features/game-controls/model/stores";
import { cn } from "@shared/model/utils";

export const CompletedBoard = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);

  if (!isCompleted) return null;

  return (
    <div
      className={cn(
        "mt-4 p-4 rounded-md text-center min-w-10/12 max-w-md",
        isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
      )}
    >
      {isSuccess
        ? "축하합니다! 스도쿠를 성공적으로 완료했습니다! 🎉"
        : "스도쿠가 정확하지 않습니다. 다시 확인해보세요. ⚠️"}
    </div>
  );
};
