import { type Difficulty, difficultyAtom, initializeGameAtom } from '@entities/game';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { options } from '../model/constants/gameDifficultySelector';

const chevronSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' " +
  "height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' " +
  "stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";
export const SelectSelector = () => {
  const difficulty = useAtomValue(difficultyAtom);
  const initializeGame = useSetAtom(initializeGameAtom);

  return (
    <select
      aria-label="난이도 선택"
      name="difficulty"
      id="difficulty"
      value={difficulty}
      onChange={(e) => initializeGame(e.target.value as Difficulty)}
      className={cn(
        'px-3 py-1.5 pr-8',
        'bg-[rgb(var(--color-bg-tertiary))]/80 backdrop-blur-sm',
        'border-none rounded-lg',
        'text-sm font-normal text-[rgb(var(--color-text-primary))]',
        'cursor-pointer',
        'transition-all duration-200 ease-out',
        'hover:bg-[rgb(var(--color-bg-tertiary))]',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]/40',
        'appearance-none',
        'bg-no-repeat',
      )}
      style={{
        backgroundImage: chevronSvg,
        backgroundPosition: 'right 10px center',
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
