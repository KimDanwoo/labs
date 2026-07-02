import { colors } from '@tokens/css';
import { SEMANTIC_ROLES } from '@views/showcase/model/constants';
import { Section } from './Section';
import { Swatch } from './Swatch';

type ColorToken = keyof typeof colors;

const TOKEN_NAMES = Object.keys(colors) as ColorToken[];

const belongsToRole = (name: string, role: string) => name === role || name.startsWith(`${role}-`);

const roleTokens = (role: string) => TOKEN_NAMES.filter((name) => belongsToRole(name, role));

const surfaceTokens = TOKEN_NAMES.filter((name) => !SEMANTIC_ROLES.some((role) => belongsToRole(name, role)));

function SwatchGrid({ names }: { names: ColorToken[] }) {
  return (
    <div className="grid grid-cols-2 gap-md sm:grid-cols-4">
      {names.map((name) => (
        <Swatch key={name} color={`var(--color-${name})`} label={name} sub={colors[name].light} />
      ))}
    </div>
  );
}

export function ColorSemanticSection() {
  return (
    <Section
      title="Color · Semantic"
      description="역할 기반 시맨틱 토큰. 스와치는 CSS 변수라 라이트/다크 토글에 실시간 반응한다."
    >
      {SEMANTIC_ROLES.map((role) => (
        <div key={role} className="flex flex-col gap-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{role}</h3>
          <SwatchGrid names={roleTokens(role)} />
        </div>
      ))}
      <div className="flex flex-col gap-sm">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">surface & effect</h3>
        <SwatchGrid names={surfaceTokens} />
      </div>
    </Section>
  );
}
