type SwatchProps = {
  color: string;
  label: string;
  sub?: string;
};

export function Swatch({ color, label, sub }: SwatchProps) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="h-3xl w-full rounded-md border border-card-border" style={{ background: color }} />
      <div className="flex flex-col">
        <span className="text-xs font-normal text-foreground">{label}</span>
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
      </div>
    </div>
  );
}
