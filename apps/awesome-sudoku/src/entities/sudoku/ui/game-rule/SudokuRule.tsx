import { useAtomValue } from 'jotai';
import { LuScrollText } from 'react-icons/lu';

import { SUDOKU_RULE } from '@entities/sudoku/config/rule';
import { gameModeAtom } from '@entities/sudoku/model/store/primitives';
import { RuleCard } from '@shared/ui/rule-card';

export function SudokuRule() {
  const gameMode = useAtomValue(gameModeAtom);
  const { title, caption, items } = SUDOKU_RULE[gameMode];

  return (
    <RuleCard.Root>
      <RuleCard.Summary>
        <RuleCard.Icon>
          <LuScrollText />
        </RuleCard.Icon>
        <RuleCard.Title>{title}</RuleCard.Title>
        <RuleCard.Caption>{caption}</RuleCard.Caption>
      </RuleCard.Summary>
      <RuleCard.Body>
        <RuleCard.List>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </RuleCard.List>
      </RuleCard.Body>
    </RuleCard.Root>
  );
}
