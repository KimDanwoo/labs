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
  "height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' " +
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
        "px-3 py-1.5 pr-8",
        "bg-slate-100/80 backdrop-blur-sm",
        "border-none rounded-lg",
        "text-sm font-medium text-slate-700",
        "cursor-pointer",
        "transition-all duration-200 ease-out",
        "hover:bg-slate-200/80",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        "appearance-none",
        "bg-no-repeat",
      )}
      style={{
        backgroundImage: chevronSvg,
        backgroundPosition: "right 10px center",
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
      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        새 게임
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
                "transition-all duration-200 ease-out",
                "active:scale-95",
                isActive
                  ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                  : "bg-white/80 text-slate-600 shadow-sm",
                !isActive && "hover:bg-white hover:text-slate-800 hover:shadow-md",
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
