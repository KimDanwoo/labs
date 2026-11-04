'use client';
import { cn } from '@shared/model/utils';

export const SuccessIcon = () => (
  <div
    className={cn(
      'w-16 h-16 mx-auto rounded-full',
      'bg-gradient-to-b',
      'from-emerald-400 to-emerald-500',
      'shadow-[0_8px_24px_rgba(16,185,129,0.3)]',
      'flex items-center justify-center',
    )}
  >
    <svg aria-hidden="true" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);
