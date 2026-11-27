import { LuScrollText } from 'react-icons/lu';

import { RuleCard } from '@shared/ui/rule-card';
import { GUESS_WORD_COPY, GUESS_WORD_RULES } from '@views/guess-word/config/copy';
import { GuessWordCredits } from '@views/guess-word/ui/GuessWordCredits';

export function GuessWordRule() {
  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{GUESS_WORD_COPY.ruleTitle}</RuleCard.Title>
        <RuleCard.Caption>{GUESS_WORD_COPY.ruleCaption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <RuleCard.List>
          {GUESS_WORD_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </RuleCard.List>
        <GuessWordCredits />
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
