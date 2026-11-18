import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';

export function MarkdownCodeBlock({ children, ...props }: ComponentProps<'pre'> & ExtraProps) {
  return (
    <div className="code-block-wrapper">
      <pre {...props}>{children}</pre>
    </div>
  );
}
