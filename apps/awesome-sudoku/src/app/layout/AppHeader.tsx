import { AppHeaderTitle } from '@app/layout/AppHeaderTitle';
import { ThemeToggle } from '@app/layout/theme-toggle/ThemeToggle';

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border-light bg-surface-primary">
      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <AppHeaderTitle />
        <ThemeToggle />
      </div>
    </header>
  );
}
