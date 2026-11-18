import type { Components } from 'react-markdown';

import { MarkdownCodeBlock } from './MarkdownCodeBlock';
import { MarkdownTable } from './MarkdownTable';

export const MARKDOWN_COMPONENTS: Components = {
  table: MarkdownTable,
  pre: MarkdownCodeBlock,
};
