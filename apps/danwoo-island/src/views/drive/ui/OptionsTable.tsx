import type { ReactNode } from 'react';

interface OptionsTableProps {
  children: ReactNode;
}

export function OptionsTable({ children }: OptionsTableProps) {
  return (
    <table className="options">
      <tbody>{children}</tbody>
    </table>
  );
}
