import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';

export function MarkdownTable({ children, ...props }: ComponentProps<'table'> & ExtraProps) {
  return (
    <div className="table-wrapper">
      <table {...props}>{children}</table>
    </div>
  );
}
