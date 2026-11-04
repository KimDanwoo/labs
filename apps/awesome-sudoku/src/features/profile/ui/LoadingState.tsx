'use client';
import { cn } from '@shared/model/utils';

export const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div
      className={cn(
        'animate-spin w-6 h-6 border-2',
        'border-[rgb(var(--color-accent))]',
        'border-t-transparent rounded-full',
      )}
    />
  </div>
);
