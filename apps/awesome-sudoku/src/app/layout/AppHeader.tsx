import { GameNav } from '@app/layout/GameNav';
import { ThemeToggle } from '@app/layout/theme-toggle/ThemeToggle';

export function AppHeader() {
  return (
    <header className="glass-header">
      <div className="mx-auto py-3 px-4 flex items-center justify-between gap-2 w-full max-w-[392px] lg:max-w-[944px] xl:max-w-[1088px]">
        <GameNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
