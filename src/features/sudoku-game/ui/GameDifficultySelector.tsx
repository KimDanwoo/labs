import { GAME_LEVEL, GAME_LEVEL_LABELS } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";

const options = [
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.EASY], value: GAME_LEVEL.EASY },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.MEDIUM], value: GAME_LEVEL.MEDIUM },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.HARD], value: GAME_LEVEL.HARD },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.EXPERT], value: GAME_LEVEL.EXPERT },
];

const chevronSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' " +
  "height='16' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2' " +
  "stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";

const SelectSelector = () => {
  const difficulty = useSudokuStore((state) => state.difficulty);
  const initializeGame = useSudokuStore((state) => state.initializeGame);

  return (
    <select
      name="difficulty"
      id="difficulty"
      value={difficulty}
      onChange={(e) => initializeGame(e.target.value as Difficulty)}
      className={cn(
        "px-4 py-2 pr-8",
        "bg-[rgb(245,245,247)]",
        "border-none rounded-xl",
        "text-sm font-medium text-[rgb(28,28,30)]",
        "cursor-pointer",
        "transition-all duration-150 ease-out",
        "hover:bg-[rgb(235,235,240)]",
        "focus:outline-none focus:ring-2 focus:ring-[rgb(0,122,255)]/30",
        "appearance-none",
        "bg-no-repeat",
      )}
      style={{
        backgroundImage: chevronSvg,
        backgroundPosition: "right 12px center",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const ListSelector = () => {
  const difficulty = useSudokuStore((state) => state.difficulty);
  const initializeGame = useSudokuStore((state) => state.initializeGame);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-[rgb(142,142,147)] uppercase tracking-wider mb-2">
        New Game
      </h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = difficulty === option.value;
          return (
            <button
              key={option.value}
              onClick={() => initializeGame(option.value as Difficulty)}
              className={cn(
                "px-4 py-2 rounded-xl",
                "text-sm font-medium",
                "transition-all duration-150 ease-out",
                "active:scale-95",
                isActive
                  ? "bg-[rgb(0,122,255)] text-white"
                  : "bg-[rgb(245,245,247)] text-[rgb(99,99,102)]",
                !isActive && "hover:bg-[rgb(235,235,240)] hover:text-[rgb(28,28,30)]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const GameDifficultySelector = Object.assign(() => {}, {
  Select: SelectSelector,
  List: ListSelector,
});

export { GameDifficultySelector };
