import { useSudokuStore } from "@features/game-controls/model/stores/sudokuStore";
import IconButton from "@shared/ui/IconButton";
import { GoPencil } from "react-icons/go";

export const ToggleNote = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const toggleNoteMode = useSudokuStore((state) => state.toggleNoteMode);
  const timerActive = useSudokuStore((state) => state.timerActive);
  return (
    <IconButton
      className={`${isNoteMode ? "bg-sky-300" : "bg-gray-300"}`}
      icon={<GoPencil className=" text-lg" />}
      onClick={toggleNoteMode}
      disabled={!timerActive}
    />
  );
};
