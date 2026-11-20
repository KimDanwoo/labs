import type { Components } from 'react-markdown';

import { MarkdownCodeBlock } from '@shared/ui/markdown-renderer/MarkdownCodeBlock';
import { MarkdownTable } from '@shared/ui/markdown-renderer/MarkdownTable';

export const MARKDOWN_COMPONENTS: Components = {
  table: MarkdownTable,
  pre: MarkdownCodeBlock,
};
