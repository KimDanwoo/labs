type SwatchProps = {
  /** 실제 적용할 색 문자열(시맨틱은 `var(--color-*)`, atomic은 hex). */
  color: string;
  label: string;
  sub?: string;
};

export function Swatch({ color, label, sub }: SwatchProps) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="h-3xl w-full rounded-md border border-card-border" style={{ background: color }} />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
      </div>
    </div>
  );
}
