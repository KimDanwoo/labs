import { SudokuBoard } from "@entities/board/model/types";
import { GAME_LEVEL, GAME_MODE } from "@entities/game/model/constants";
import { Difficulty, GameMode, KillerCage } from "@entities/game/model/types";
import {
  generateBoard,
  generateKillerBoard,
  generateSolution,
} from "@features/game-board/model/utils";
import { initialSudokuState } from "@features/game-controls/model/stores/initialState";
import { SudokuStoreActionCreator } from "@features/game-controls/model/stores/types";

export const createGameLifecycleActions: SudokuStoreActionCreator<
  "initializeGame" | "switchGameMode" | "restartGame"
> = (set, get) => ({
  initializeGame: (difficulty: Difficulty = GAME_LEVEL.MEDIUM) => {
    const solution = generateSolution();
    const { gameMode } = get();

    let board: SudokuBoard;
    let cages: KillerCage[] = [];

    if (gameMode === GAME_MODE.KILLER) {
      const killerResult = generateKillerBoard(solution, difficulty);
      board = killerResult.board;
      cages = killerResult.cages;
    } else {
      board = generateBoard(solution, difficulty);
    }

    set({
      ...initialSudokuState,
      board,
      solution,
      difficulty,
      gameMode,
      cages,
    });

    get().toggleTimer(true);
    get().countBoardNumbers();
  },

  switchGameMode: (mode: GameMode, difficulty?: Difficulty) => {
    const currentDifficulty = difficulty ?? get().difficulty;
    set({ gameMode: mode });
    get().initializeGame(currentDifficulty);
  },

  restartGame: () => {
    const { difficulty } = get();
    get().initializeGame(difficulty);
  },
});
