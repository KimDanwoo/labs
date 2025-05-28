import { GAME_LEVEL, GAME_LEVEL_LABELS } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";
import { useSudokuStore } from "@features/game-controls/model/stores";

const options = [
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.EASY], value: GAME_LEVEL.EASY },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.MEDIUM], value: GAME_LEVEL.MEDIUM },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.HARD], value: GAME_LEVEL.HARD },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.EXPERT], value: GAME_LEVEL.EXPERT },
];

const SelectSelector = () => {
  const difficulty = useSudokuStore((state) => state.difficulty);
  const initializeGame = useSudokuStore((state) => state.initializeGame);

  return (
    <select
      name="difficulty"
      id="difficulty"
      value={difficulty}
      onChange={(e) => initializeGame(e.target.value as Difficulty)}
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <ul className="flex flex-col gap-2 cursor-pointer">
      {options.map((option) => (
        <li
          key={option.value}
          onClick={() => initializeGame(option.value as Difficulty)}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            difficulty === option.value ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"
          }`}
        >
          {option.label}
        </li>
      ))}
    </ul>
  );
};

const GameDifficultySelector = Object.assign(() => {}, {
  Select: SelectSelector,
  List: ListSelector,
});

export { GameDifficultySelector };
