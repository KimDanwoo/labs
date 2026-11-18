import type { Project } from '../../model/types/project';

export const styles = {
  link: 'group flex h-full flex-col gap-md rounded-xl fade-up',
  media:
    'relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border group-hover:ring-primary/60 group-hover:transition-shadow group-hover:duration-200 group-active:ring-primary',
  image: 'object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]',
  imagePosition: { top: 'object-top', center: 'object-center' } satisfies Record<
    NonNullable<Project['imagePosition']>,
    string
  >,
  fallback:
    'absolute inset-0 flex items-center justify-center font-display text-5xl font-bold tracking-tight text-muted-foreground select-none',
  body: 'flex flex-col gap-xs px-xs',
  titleRow: 'flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs',
  title:
    'font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary group-hover:transition-colors group-hover:duration-200 sm:text-xl',
  host: 'inline-flex items-center gap-xs text-sm text-muted-foreground group-hover:text-primary group-hover:transition-colors group-hover:duration-200',
  description: 'leading-relaxed text-muted-foreground',
  scope: 'text-sm text-muted-foreground',
} as const;
