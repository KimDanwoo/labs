import type { ReactNode } from 'react';

interface StatusPillNoteProps {
  children: ReactNode;
}

export function StatusPillNote({ children }: StatusPillNoteProps) {
  return <small className="text-sm font-semibold opacity-75">{children}</small>;
}
