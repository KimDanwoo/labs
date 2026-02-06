import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { LuPencil } from "react-icons/lu";

export const ToggleNote = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const toggleNoteMode = useSudokuStore((state) => state.toggleNoteMode);

  return (
    <IconButton
      icon={<LuPencil strokeWidth={2} />}
      label="메모"
      onClick={toggleNoteMode}
      disabled={!timerActive}
      variant={isNoteMode ? "primary" : "default"}
    />
  );
};
