export function LabFooter() {
  return (
    <footer className="mt-auto flex flex-col gap-lg pt-2xl fade-up" style={{ animationDelay: '600ms' }}>
      <div className="h-px bg-linear-to-r from-transparent via-glass-border to-transparent" />
      <div className="flex flex-col gap-xs">
        <span className="font-display text-xs font-semibold tracking-widest text-foreground/40 uppercase">
          Danwoo Lab
        </span>
        <span className="text-xs text-muted-foreground/60">© 2026 · 김단우</span>
      </div>
    </footer>
  );
}
