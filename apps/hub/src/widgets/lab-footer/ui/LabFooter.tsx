import { ThemeToggle } from '@ui/react';

export function LabFooter() {
  return (
    <footer className="flex items-center justify-between gap-md border-t border-card-border pt-lg">
      <span className="text-xs text-muted">© 2026 Danwoo Lab</span>
      <ThemeToggle />
    </footer>
  );
}
