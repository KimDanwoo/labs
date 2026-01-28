import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { GoPencil } from "react-icons/go";

export const ToggleNote = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const toggleNoteMode = useSudokuStore((state) => state.toggleNoteMode);

  return (
    <IconButton
      icon={<GoPencil />}
      label="Notes"
      onClick={toggleNoteMode}
      disabled={!timerActive}
      variant={isNoteMode ? "primary" : "default"}
    />
  );
};
