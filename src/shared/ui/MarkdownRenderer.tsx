'use client';

import dynamic from 'next/dynamic';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse h-20 bg-muted rounded" />,
});

interface MarkdownRendererProps {
  content: string;
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

const components: Components = {
  table: ({ children, ...props }) => (
    <div className="table-wrapper">
      <table {...props}>{children}</table>
    </div>
  ),
  pre: ({ children, ...props }) => (
    <div className="code-block-wrapper">
      <pre {...props}>{children}</pre>
    </div>
  ),
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
