export const styles = {
  link: {
    base: 'flex items-center gap-3 rounded-xl px-3 py-2.5 mx-1 text-sm transition-all duration-200',
    active: 'bg-primary text-primary-foreground shadow-sm',
    inactive: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  },
} as const;
