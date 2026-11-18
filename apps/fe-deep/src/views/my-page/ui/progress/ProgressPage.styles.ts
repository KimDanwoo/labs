export const styles = {
  statIcon: {
    base: 'mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full',
    study: 'bg-study/10',
    success: 'bg-success-subtle',
    warning: 'bg-warning-subtle',
    muted: 'bg-muted',
  },
  statGlyph: {
    base: 'h-5 w-5',
    study: 'text-study',
    success: 'text-success',
    warning: 'text-warning',
    muted: 'text-muted-foreground',
  },
} as const;
