import { shadow } from '@tokens/css';
import { Section } from './Section';

export function ShadowSection() {
  return (
    <Section title="Shadow" description="입체(elevation)와 브랜드 glow 강조. glow는 코발트 기반.">
      <div className="grid grid-cols-2 gap-lg sm:grid-cols-3">
        {Object.entries(shadow).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-sm">
            <div className="h-3xl w-full rounded-lg border border-card-border bg-card" style={{ boxShadow: value }} />
            <span className="text-xs text-muted-foreground">shadow-{name}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
