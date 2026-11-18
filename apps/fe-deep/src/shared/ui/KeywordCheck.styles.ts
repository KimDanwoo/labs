export const styles = {
  root: 'rounded-lg border border-border/60 p-4',
  summary: 'mb-2 text-xs font-normal text-muted-foreground',
  list: 'flex flex-wrap gap-1.5',
  keyword: {
    base: 'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
    matched: 'bg-primary/10 text-primary',
    missed: 'bg-muted text-muted-foreground',
  },
  matchedIcon: 'size-3',
  missedIcon: 'size-3 opacity-50',
} as const;
