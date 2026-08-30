'use client';

import { cn } from '@shared/model/utils';
import Link from 'next/link';
import { memo, type ReactNode } from 'react';

interface SubpageHeaderProps {
  title: string;
  rightAction?: ReactNode;
}

export const SubpageHeader = memo<SubpageHeaderProps>(({ title, rightAction }) => (
  <header className={cn('glass-header')}>
    <div
      className={cn(
        'relative max-w-5xl xl:max-w-6xl mx-auto',
        'px-4 sm:px-6 py-3',
        'flex items-center justify-between',
      )}
    >
      <Link
        href="/"
        className={cn(
          'flex items-center gap-1.5',
          'text-[rgb(var(--color-text-secondary))]',
          'hover:text-[rgb(var(--color-text-primary))]',
          'transition-colors',
        )}
      >
        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className={cn('text-sm font-medium', 'hidden sm:inline')}>게임으로</span>
      </Link>

      <h1
        className={cn(
          'absolute left-1/2 -translate-x-1/2',
          'text-lg font-bold',
          'text-[rgb(var(--color-text-primary))]',
        )}
      >
        {title}
      </h1>

      {rightAction}
    </div>
  </header>
));

SubpageHeader.displayName = 'SubpageHeader';
