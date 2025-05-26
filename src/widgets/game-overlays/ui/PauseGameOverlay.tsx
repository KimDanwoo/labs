import { useSudokuStore } from "@features/game-controls/model/stores";
import { FC } from "react";
import { IoPlayCircleOutline } from "react-icons/io5";

export const PauseGameOverlay: FC = () => {
  const timerActive = useSudokuStore((state) => state.timerActive);
  const toggleTimer = useSudokuStore((state) => state.toggleTimer);
  const isCompleted = useSudokuStore((state) => state.isCompleted);

  const positionClass = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
  if (timerActive || isCompleted) return null;

  return (
    <div className="absolute inset-0 bg-white z-20">
      <IoPlayCircleOutline
        className={`${positionClass} text-7xl text-sky-300 cursor-pointer`}
        onClick={() => toggleTimer()}
      />
    </div>
  );
};

export default PauseGameOverlay;
