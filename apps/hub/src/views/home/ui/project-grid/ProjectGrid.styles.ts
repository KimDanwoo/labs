import type { RowSize } from '../../lib/gridRows';

export const styles = {
  section: 'flex flex-col gap-xl',
  header: 'flex items-baseline justify-between gap-md border-b border-border pb-md fade-up',
  title: 'font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl',
  count: 'text-sm text-muted-foreground',
  list: 'grid grid-cols-1 gap-x-lg gap-y-2xl sm:grid-cols-2 lg:grid-cols-6',
  desktopSpan: { 1: 'lg:col-span-6', 2: 'lg:col-span-3', 3: 'lg:col-span-2' } satisfies Record<RowSize, string>,
  tabletFullSpan: 'sm:col-span-2',
} as const;
