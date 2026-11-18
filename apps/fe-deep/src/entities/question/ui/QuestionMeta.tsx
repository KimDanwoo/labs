import { CheckCircle } from 'lucide-react';

import type { Difficulty } from '../model/types/types';
import { DifficultyBadge } from './DifficultyBadge';
import { styles } from './QuestionMeta.styles';

interface QuestionMetaProps {
  difficulty: Difficulty;
  subCategory?: string;
  isMastered?: boolean;
}

export function QuestionMeta({ difficulty, subCategory, isMastered }: QuestionMetaProps) {
  return (
    <div className={styles.root}>
      <DifficultyBadge difficulty={difficulty} />
      {subCategory && <span className={styles.subCategory}>{subCategory}</span>}
      {isMastered && <CheckCircle className={styles.mastered} />}
    </div>
  );
}
