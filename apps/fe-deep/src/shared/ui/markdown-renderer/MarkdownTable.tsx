import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';

import { styles } from './MarkdownRenderer.styles';

export function MarkdownTable({ children, ...props }: ComponentProps<'table'> & ExtraProps) {
  return (
    <div className={styles.tableWrapper}>
      <table {...props}>{children}</table>
    </div>
  );
}
