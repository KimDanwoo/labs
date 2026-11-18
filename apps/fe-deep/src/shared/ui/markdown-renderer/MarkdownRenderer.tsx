'use client';

import dynamic from 'next/dynamic';

import { MARKDOWN_REHYPE_PLUGINS, MARKDOWN_REMARK_PLUGINS } from '@shared/config/markdown';

import { MARKDOWN_COMPONENTS } from './markdownComponents';
import { styles } from './MarkdownRenderer.styles';
import { MarkdownSkeleton } from './MarkdownSkeleton';

const ReactMarkdown = dynamic(() => import('react-markdown'), { loading: MarkdownSkeleton });

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className={styles.body}>
      <ReactMarkdown
        remarkPlugins={MARKDOWN_REMARK_PLUGINS}
        rehypePlugins={MARKDOWN_REHYPE_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
