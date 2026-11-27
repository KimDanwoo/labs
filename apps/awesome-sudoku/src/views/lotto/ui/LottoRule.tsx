import { LuScrollText } from 'react-icons/lu';

import { RuleCard } from '@shared/ui/rule-card';
import { LOTTO_COPY } from '@views/lotto/config/copy';

export function LottoRule() {
  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{LOTTO_COPY.ruleTitle}</RuleCard.Title>
        <RuleCard.Caption>{LOTTO_COPY.ruleCaption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <p>{LOTTO_COPY.rule}</p>
        <p className="text-[13px] text-text-tertiary">{LOTTO_COPY.disclaimer}</p>
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
