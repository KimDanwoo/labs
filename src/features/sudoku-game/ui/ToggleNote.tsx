import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { useShallow } from "zustand/react/shallow";
import { LuPencil } from "react-icons/lu";

export const ToggleNote = () => {
  const { isNoteMode, timerActive, toggleNoteMode } = useSudokuStore(
    useShallow((state) => ({
      isNoteMode: state.isNoteMode,
      timerActive: state.timerActive,
      toggleNoteMode: state.toggleNoteMode,
    })),
  );

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
