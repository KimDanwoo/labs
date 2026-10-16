import type { ReactNode } from 'react';

type KeyCapProps = {
  children: ReactNode;
};

export function KeyCap({ children }: KeyCapProps) {
  return (
    <kbd className="inline-flex min-w-lg items-center justify-center rounded-sm border border-prairie-paper/30 bg-prairie-paper/10 px-sm py-xs font-mono text-xs text-prairie-paper">
      {children}
    </kbd>
  );
}
