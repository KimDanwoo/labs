import { LuScrollText } from 'react-icons/lu';

import { RuleCard } from '@shared/ui/rule-card';
import { GOMOKU_COPY } from '@views/gomoku/config/copy';

export function GomokuRule() {
  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{GOMOKU_COPY.ruleTitle}</RuleCard.Title>
        <RuleCard.Caption>{GOMOKU_COPY.ruleCaption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <p>{GOMOKU_COPY.rule}</p>
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
