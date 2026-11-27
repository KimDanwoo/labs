import { AppHeaderTitle } from '@app/layout/AppHeaderTitle';
import { ThemeToggle } from '@app/layout/theme-toggle/ThemeToggle';

export function AppHeader() {
  return (
    <header className="h-16 bg-surface-primary">
      <div className="relative mx-auto flex h-full w-full max-w-[1120px] items-center justify-between gap-3 px-5 lg:px-8">
        <AppHeaderTitle />
        <ThemeToggle />
      </div>
    </header>
  );
}
