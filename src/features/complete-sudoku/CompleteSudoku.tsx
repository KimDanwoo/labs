import { EASY, EXPERT, HARD, MEDIUM, useSudokuStore } from "@entities/sudoku/model";

export const CompleteSudoku = () => {
  // const currentTime = useSudokuStore((state) => state.currentTime);
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const initializeGame = useSudokuStore((state) => state.initializeGame);

  if (!isCompleted) return null;

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center">
      <ul className="flex flex-col gap-2 cursor-pointer">
        <li onClick={() => initializeGame(EASY)}>쉬움</li>
        <li onClick={() => initializeGame(MEDIUM)}>중간</li>
        <li onClick={() => initializeGame(HARD)}>어려움</li>
        <li onClick={() => initializeGame(EXPERT)}>매우 어려움</li>
      </ul>
    </div>
  );
};
