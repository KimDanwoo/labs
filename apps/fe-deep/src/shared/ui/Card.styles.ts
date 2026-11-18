export const styles = {
  root: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border/60 p-6 shadow-sm transition-all duration-300',
  header:
    '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
  title: 'leading-none font-semibold',
  description: 'text-muted-foreground text-sm',
  action: 'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
  footer: 'flex items-center [.border-t]:pt-6',
} as const;
