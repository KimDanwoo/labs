export const styles = {
  header: 'relative isolate flex flex-col gap-lg py-lg sm:gap-xl sm:py-xl',
  glow: 'pointer-events-none absolute top-0 left-0 -z-10 size-72 rounded-full bg-glow blur-3xl hero-glow',
  title:
    'font-display text-3xl leading-tight font-bold tracking-tight text-foreground min-[400px]:text-4xl sm:text-5xl lg:text-6xl',
  flowText: 'text-flow',
  divider: 'h-px bg-linear-to-r from-card-border to-transparent fade-up',
  intro:
    'flex max-w-(--container-2xl) flex-col gap-md text-base leading-[1.8] text-secondary-foreground sm:text-lg fade-up',
  link: 'py-xs text-primary underline decoration-primary/40 underline-offset-4 hover:text-primary-accent hover:decoration-primary-accent hover:transition-colors hover:duration-150 active:text-primary-accent',
} as const;
