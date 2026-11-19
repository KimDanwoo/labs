import { GameModeSelector } from './sudoku-game/GameModeSelector';
import { ThemeToggle } from './ThemeToggle';

export function HomeHeader() {
  return (
    <header className="glass-header">
      <h1 className="sr-only">어썸 스도쿠</h1>
      <div className="mx-auto py-3 flex items-center justify-between w-full max-w-[360px] lg:max-w-[912px] xl:max-w-[1056px]">
        <GameModeSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}
