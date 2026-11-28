import type { ReactNode } from 'react';

interface GostopSideProps {
  children: ReactNode;
}

export function GostopSide({ children }: GostopSideProps) {
  return <div className="grid content-start gap-5 max-lg:hidden short-landscape:grid">{children}</div>;
}
