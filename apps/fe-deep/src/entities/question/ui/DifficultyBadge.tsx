import { Badge } from '@ui/react';
import { DIFFICULTY_CONFIG } from '../model/constants/constants';
import type { Difficulty } from '../model/types/types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
