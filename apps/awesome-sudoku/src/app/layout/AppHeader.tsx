import { AppHeaderTitle } from '@app/layout/AppHeaderTitle';
import { ThemeToggle } from '@app/layout/theme-toggle/ThemeToggle';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 h-16 bg-surface-primary after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border-light after:opacity-0 after:content-[''] after:[animation:header-divider_linear_both] after:[animation-range:0_24px] after:[animation-timeline:scroll(root)]">
      <div className="relative mx-auto flex h-full w-full max-w-[1120px] items-center justify-between gap-3 px-5 lg:px-8">
        <AppHeaderTitle />
        <ThemeToggle />
      </div>
    </header>
  );
}
