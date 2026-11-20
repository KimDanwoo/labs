import { DIFFICULTY_CONFIG } from '@entities/question/model/constants/constants';
import type { Difficulty } from '@entities/question/model/types/types';
import { Badge } from '@shared/ui/Badge';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
