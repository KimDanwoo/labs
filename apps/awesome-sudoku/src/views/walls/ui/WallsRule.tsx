import { LuScrollText } from 'react-icons/lu';

import { RuleCard } from '@shared/ui/rule-card';
import { WALLS_COPY, WALLS_RULES } from '@views/walls/config/copy';

export function WallsRule() {
  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{WALLS_COPY.ruleTitle}</RuleCard.Title>
        <RuleCard.Caption>{WALLS_COPY.ruleCaption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <RuleCard.List>
          {WALLS_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </RuleCard.List>
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
