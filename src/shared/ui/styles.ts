import { cn } from '@shared/lib/cn';

export const inputBase = cn(
  'w-full rounded-xl px-4 py-3',
  'bg-white/5 border border-gold/30',
  'text-foreground text-sm font-medium placeholder:text-muted/50',
  'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30',
  'transition-all duration-200',
);
