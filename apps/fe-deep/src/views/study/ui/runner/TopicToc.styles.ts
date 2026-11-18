export const styles = {
  item: {
    base: 'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
    active: 'bg-muted font-normal text-foreground',
    inactive: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  },
} as const;
