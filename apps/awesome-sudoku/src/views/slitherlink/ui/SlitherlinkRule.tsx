import { LuScrollText } from 'react-icons/lu';

import { RuleCard } from '@shared/ui/rule-card';
import { SLITHERLINK_COPY, SLITHERLINK_RULES } from '@views/slitherlink/config/copy';

export function SlitherlinkRule() {
  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{SLITHERLINK_COPY.ruleTitle}</RuleCard.Title>
        <RuleCard.Caption>{SLITHERLINK_COPY.ruleCaption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <RuleCard.List>
          {SLITHERLINK_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </RuleCard.List>
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
