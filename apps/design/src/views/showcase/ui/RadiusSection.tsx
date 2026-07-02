import { radius } from '@tokens/css';
import { Section } from './Section';

export function RadiusSection() {
  return (
    <Section title="Radius" description="모서리 반경 스케일.">
      <div className="flex flex-wrap gap-lg">
        {Object.entries(radius).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-xs">
            <div className="h-3xl w-3xl border border-primary bg-primary-subtle" style={{ borderRadius: value }} />
            <span className="text-xs text-foreground">{name}</span>
            <span className="text-xs text-muted">{value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
