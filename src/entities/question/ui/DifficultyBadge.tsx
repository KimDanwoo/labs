import { Badge } from '@shared/ui';
import { DIFFICULTY_CONFIG } from '@entities/question/model';
import type { Difficulty } from '@entities/question/model';

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
