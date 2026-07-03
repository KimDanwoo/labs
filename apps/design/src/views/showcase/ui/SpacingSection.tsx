import { spacing } from '@tokens/css';
import { Section } from './Section';

export function SpacingSection() {
  return (
    <Section title="Spacing" description="padding · margin · gap · width 등에 쓰는 여백 스케일.">
      <div className="flex flex-col gap-sm">
        {Object.entries(spacing).map(([name, value]) => (
          <div key={name} className="flex items-center gap-md">
            <span className="w-3xl shrink-0 text-xs text-muted-foreground">{name}</span>
            <span className="w-3xl shrink-0 text-xs text-muted-foreground">{value}</span>
            <span className="h-md rounded-sm bg-primary" style={{ width: value }} />
          </div>
        ))}
      </div>
    </Section>
  );
}
