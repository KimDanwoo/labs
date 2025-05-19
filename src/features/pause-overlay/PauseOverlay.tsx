import { useSudokuStore } from "@entities/sudoku/model";

export const PauseOverlay = () => {
  const timerActive = useSudokuStore((state) => state.timerActive);

  if (timerActive) return null;

  return <div className="absolute w-full h-full bg-amber-100 z-10">PauseOverlay</div>;
};
