import { useSudokuStore } from "@features/game-controls/model/stores";
import { IconButton } from "@shared/ui";
import { GoPencil } from "react-icons/go";

export const ToggleNote = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const toggleNoteMode = useSudokuStore((state) => state.toggleNoteMode);

  return (
    <IconButton
      className={`${isNoteMode ? "bg-sky-300" : "bg-gray-300"}`}
      icon={<GoPencil className=" text-lg" />}
      onClick={toggleNoteMode}
      disabled={!timerActive}
    />
  );
};
