export const styles = {
  root: 'container mx-auto max-w-168 px-4 py-8 sm:py-12 animate-fade-in-up',
  body: 'text-center py-16',
  trophy: 'h-16 w-16 text-highlight mx-auto mb-5',
  title: 'text-3xl font-bold tracking-tight mb-3',
  summary: 'text-muted-foreground mb-6',
  streak: 'inline-flex items-center gap-2 rounded-full bg-streak/10 border border-streak/20 px-4 py-2 mb-8',
  streakIcon: 'h-5 w-5 text-streak',
  streakText: 'text-lg font-bold',
  actions: 'flex gap-3 justify-center',
  restart: 'gap-2 shadow-sm',
  progressLink: 'gap-2',
} as const;
