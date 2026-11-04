import { DIFFICULTY_CONFIG } from '@entities/question/model/constants';
import type { Difficulty } from '@entities/question/model/types';
import { Badge } from '@ui/react';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
