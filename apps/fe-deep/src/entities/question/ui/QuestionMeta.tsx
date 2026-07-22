import { CheckCircle } from 'lucide-react';
import { DifficultyBadge } from './DifficultyBadge';
import type { Difficulty } from '@entities/question/model';

interface QuestionMetaProps {
  difficulty: Difficulty;
  subCategory?: string;
  isMastered?: boolean;
}

export function QuestionMeta({ difficulty, subCategory, isMastered }: QuestionMetaProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DifficultyBadge difficulty={difficulty} />
      {subCategory && <span className="text-xs text-muted-foreground">{subCategory}</span>}
      {isMastered && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
    </div>
  );
}
