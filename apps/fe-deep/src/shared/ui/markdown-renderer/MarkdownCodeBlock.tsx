import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';

import { styles } from './MarkdownRenderer.styles';

export function MarkdownCodeBlock({ children, ...props }: ComponentProps<'pre'> & ExtraProps) {
  return (
    <div className={styles.codeBlockWrapper}>
      <pre {...props}>{children}</pre>
    </div>
  );
}
