import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createCellValueActions } from "@features/game-controls/model/stores/actions/cellValueActions";
import { createGameLifecycleActions } from "@features/game-controls/model/stores/actions/gameLifecycleActions";
import { createHintActions } from "@features/game-controls/model/stores/actions/hintActions";
import { createKeyboardActions } from "@features/game-controls/model/stores/actions/keyboardActions";
import { createSelectionActions } from "@features/game-controls/model/stores/actions/selectionActions";
import { createStatusActions } from "@features/game-controls/model/stores/actions/statusActions";
import { createTimerActions } from "@features/game-controls/model/stores/actions/timerActions";
import { initialSudokuState, SUDOKU_STORAGE_KEYS } from "@features/game-controls/model/stores/initialState";
import { SudokuStore } from "@features/game-controls/model/stores/types";

export const useSudokuStore = create<SudokuStore>()(
  persist(
    (set, get) => ({
      ...initialSudokuState,
      ...createTimerActions(set, get),
      ...createStatusActions(set, get),
      ...createSelectionActions(set, get),
      ...createCellValueActions(set, get),
      ...createHintActions(set, get),
      ...createKeyboardActions(set, get),
      ...createGameLifecycleActions(set, get),
    }),
    {
      name: "awesome-sudoku-storage",
      partialize: (state) =>
        Object.fromEntries(SUDOKU_STORAGE_KEYS.map((key) => [key, state[key]])) as Partial<SudokuStore>,
    },
  ),
);
