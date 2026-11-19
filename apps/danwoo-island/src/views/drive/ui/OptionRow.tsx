import type { ReactNode } from 'react';

interface OptionRowProps {
  label: ReactNode;
  children: ReactNode;
}

export function OptionRow({ label, children }: OptionRowProps) {
  return (
    <tr>
      <td>{label}</td>
      <td>{children}</td>
    </tr>
  );
}
