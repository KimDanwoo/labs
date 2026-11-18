export const styles = {
  root: 'container mx-auto max-w-7xl px-4 py-8 sm:py-12',
  header: 'mb-10 animate-fade-in',
  title: 'text-3xl font-bold tracking-tight mb-3',
  description: 'text-muted-foreground',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  cardLink: 'animate-fade-in-up',
  card: 'card-hover hover:border-primary/30 cursor-pointer h-full group',
  iconRow: 'flex items-center justify-between mb-3',
  icon: 'text-3xl group-hover:scale-110 transition-transform duration-300',
  cardTitle: 'group-hover:text-primary transition-colors duration-200',
  cardDescription: 'text-sm leading-relaxed',
} as const;
