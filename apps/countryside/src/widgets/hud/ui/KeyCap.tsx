import type { ReactNode } from 'react';

type KeyCapProps = {
  children: ReactNode;
};

export function KeyCap({ children }: KeyCapProps) {
  return (
    <kbd className="inline-flex min-w-xl items-center justify-center rounded-md bg-foreground/10 px-sm py-xs text-sm font-medium text-foreground">
      {children}
    </kbd>
  );
}
