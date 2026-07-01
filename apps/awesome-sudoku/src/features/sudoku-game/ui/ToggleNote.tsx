import {
  isNoteModeAtom, timerActiveAtom, toggleNoteModeAtom,
} from "@features/sudoku-game/model/atoms";
import { IconButton } from "@shared/ui";
import { useAtomValue, useSetAtom } from "jotai";
import { LuPencil } from "react-icons/lu";

export const ToggleNote = () => {
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const toggleNoteMode = useSetAtom(toggleNoteModeAtom);

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
