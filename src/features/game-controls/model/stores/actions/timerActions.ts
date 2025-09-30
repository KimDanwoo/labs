import { SudokuStoreActionCreator } from "@features/game-controls/model/stores/types";

export const createTimerActions: SudokuStoreActionCreator<"incrementTimer" | "toggleTimer"> = (set, get) => ({
  incrementTimer: () => {
    const { currentTime, timerActive } = get();
    if (timerActive) {
      set({ currentTime: currentTime + 1 });
    }
  },

  toggleTimer: (isActive) => {
    if (isActive !== undefined) {
      set({ timerActive: isActive });
      return;
    }

    set((state) => ({ timerActive: !state.timerActive }));
  },
});
