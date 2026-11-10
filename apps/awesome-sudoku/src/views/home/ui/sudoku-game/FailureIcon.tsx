'use client';
import { cn } from '@shared/lib/cn';

export const FailureIcon = () => (
  <div
    className={cn(
      'w-16 h-16 mx-auto rounded-full',
      'bg-gradient-to-b from-rose-400 to-rose-500',
      'shadow-[0_8px_24px_rgba(244,63,94,0.3)]',
      'flex items-center justify-center',
    )}
  >
    <svg aria-hidden="true" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);
