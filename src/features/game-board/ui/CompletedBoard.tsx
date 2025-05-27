import { useSudokuStore } from "@features/game-controls/model/stores";

export const CompletedBoard = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);

  if (!isCompleted) return null;

  return (
    <div
      className={`mt-4 p-4 rounded-md ${
        isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      } text-center w-full max-w-md`}
    >
      {isSuccess
        ? "축하합니다! 스도쿠를 성공적으로 완료했습니다! 🎉"
        : "스도쿠가 정확하지 않습니다. 다시 확인해보세요. ⚠️"}
    </div>
  );
};
