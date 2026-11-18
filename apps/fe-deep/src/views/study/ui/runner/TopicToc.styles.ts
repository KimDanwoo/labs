export const styles = {
  nav: 'p-2',
  heading: 'px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
  list: 'space-y-0.5',
  item: {
    base: 'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
    active: 'bg-muted font-normal text-foreground',
    inactive: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  },
  number: 'shrink-0 pt-0.5 text-xs tabular-nums opacity-60',
  title: 'break-keep',
  marks: 'ml-auto flex shrink-0 items-center gap-1 pt-0.5',
  understood: 'size-3.5 text-primary',
  review: 'size-3.5 text-warning',
  stepCount: 'text-xs tabular-nums opacity-50',
} as const;
