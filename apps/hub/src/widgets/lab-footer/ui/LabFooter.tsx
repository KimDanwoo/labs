import { ThemeToggle } from '@ui/react';

export function LabFooter() {
  return (
    <footer className="mt-auto flex flex-col gap-lg pt-lg">
      <div className="h-px bg-linear-to-r from-transparent via-glass-border to-transparent" />
      <div className="flex items-center justify-between gap-md">
        <span className="text-xs text-muted">© 2026 Danwoo Lab</span>
        <ThemeToggle />
      </div>
    </footer>
  );
}
