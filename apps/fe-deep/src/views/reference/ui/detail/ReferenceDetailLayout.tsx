import type { ReactNode } from 'react';

interface ReferenceDetailLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ReferenceDetailLayout({ sidebar, children }: ReferenceDetailLayoutProps) {
  return (
    <div className="flex gap-8">
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 border border-border/60 rounded-xl shadow-sm">{sidebar}</div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
