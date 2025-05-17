import { formatTime, useSudokuStore } from "@entities/sudoku/model";
import { useEffect } from "react";
import { AiOutlinePause } from "react-icons/ai";
import { VscPlay } from "react-icons/vsc";

export const TimerControl = () => {
  const currentTime = useSudokuStore((state) => state.currentTime);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const incrementTimer = useSudokuStore((state) => state.incrementTimer);
  const toggleTimer = useSudokuStore((state) => state.toggleTimer);

  // 타이머 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timerActive) {
      timer = setInterval(() => {
        incrementTimer();
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, incrementTimer]);

  return (
    <div className="flex items-center gap-2">
      <div className="text-md font-mono">{formatTime(currentTime)}</div>
      <button className={"p-2 rounded-full transition-colors bg-gray-300"} onClick={() => toggleTimer()}>
        {timerActive ? <AiOutlinePause className="text-gray-500" /> : <VscPlay className="text-gray-500" />}
      </button>
    </div>
  );
};
