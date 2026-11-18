export const styles = {
  scroller: 'max-h-[calc(100vh-8rem)]',
  nav: 'flex flex-col gap-1 p-2',
  link: {
    base: 'flex items-center gap-3 rounded-xl px-3 py-2.5 mx-1 text-sm transition-all duration-200',
    active: 'bg-primary text-primary-foreground shadow-sm',
    inactive: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  },
  icon: 'text-base',
  title: 'truncate',
} as const;
