import { type Difficulty, DIFFICULTY_CONFIG } from '@entities/question/model';
import { Badge } from '@shared/ui';

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
