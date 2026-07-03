import { fontFamily, fontSize, fontWeight } from '@tokens/css';
import { Section } from './Section';

const SAMPLE = '단우랩 Design System 0123';

export function TypographySection() {
  return (
    <Section title="Typography" description="폰트 패밀리 · 크기 스케일 · 굵기. 값은 각 토큰을 그대로 적용해 렌더.">
      <div className="flex flex-col gap-md">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">family</h3>
        {Object.entries(fontFamily).map(([name, value]) => (
          <div key={name} className="flex flex-col gap-xs border-b border-card-border pb-sm">
            <span className="text-xs text-muted-foreground">font-{name}</span>
            <span className="text-xl text-foreground" style={{ fontFamily: value }}>
              {SAMPLE}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-md">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">size</h3>
        {Object.entries(fontSize).map(([name, value]) => (
          <div key={name} className="flex items-baseline gap-md border-b border-card-border pb-sm">
            <span className="w-3xl shrink-0 text-xs text-muted-foreground">{name}</span>
            <span className="w-3xl shrink-0 text-xs text-muted-foreground">{value}</span>
            <span className="truncate text-foreground" style={{ fontSize: value }}>
              {SAMPLE}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-md">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">weight</h3>
        {Object.entries(fontWeight).map(([name, value]) => (
          <div key={name} className="flex items-baseline gap-md border-b border-card-border pb-sm">
            <span className="w-3xl shrink-0 text-xs text-muted-foreground">{name}</span>
            <span className="w-3xl shrink-0 text-xs text-muted-foreground">{value}</span>
            <span className="text-lg text-foreground" style={{ fontWeight: value }}>
              {SAMPLE}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
