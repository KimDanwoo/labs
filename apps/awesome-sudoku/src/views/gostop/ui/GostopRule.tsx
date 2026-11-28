import { LuScrollText } from 'react-icons/lu';

import { RuleCard } from '@shared/ui/rule-card';
import { GOSTOP_COPY, GOSTOP_RULES } from '@views/gostop/config/copy';

export function GostopRule() {
  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{GOSTOP_COPY.ruleTitle}</RuleCard.Title>
        <RuleCard.Caption>{GOSTOP_COPY.ruleCaption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <RuleCard.List>
          {GOSTOP_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </RuleCard.List>
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
