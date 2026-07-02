import { themeColors } from '@tokens/css';
import { Section } from './Section';
import { Swatch } from './Swatch';

type Scale = keyof typeof themeColors;

const SCALES = Object.keys(themeColors) as Scale[];

export function PaletteSection() {
  return (
    <Section
      title="Color · Atomic 팔레트"
      description="시맨틱 토큰의 기반이 되는 원자 색 스케일(50–900). cobalt가 primary 앵커."
    >
      {SCALES.map((scale) => (
        <div key={scale} className="flex flex-col gap-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{scale}</h3>
          <div className="grid grid-cols-5 gap-sm sm:grid-cols-10">
            {Object.entries(themeColors[scale]).map(([step, hex]) => (
              <Swatch key={step} color={hex} label={step} sub={hex} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
