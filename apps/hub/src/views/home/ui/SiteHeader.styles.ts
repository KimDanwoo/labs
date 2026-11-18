export const styles = {
  header: 'sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-xl',
  inner: 'mx-auto flex w-full max-w-5xl items-center justify-between px-lg py-md header-condense',
  brandLink: 'group inline-flex items-center gap-sm transition-opacity duration-200 hover:opacity-70',
  brandDot: 'inline-flex h-2.5 w-2.5 rounded-full bg-primary transition-transform duration-300 group-hover:scale-125',
  brandName: 'font-display text-base font-bold tracking-[-0.02em] text-foreground',
} as const;
