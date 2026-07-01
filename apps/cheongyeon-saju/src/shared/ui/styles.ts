import { cn } from '@shared/lib/cn';

export const inputBase = cn(
  'w-full rounded-lg px-3 py-2',
  'bg-white/5 border border-primary/30',
  'text-foreground text-sm font-medium placeholder:text-muted/50',
  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
  'transition-all duration-200',
);
