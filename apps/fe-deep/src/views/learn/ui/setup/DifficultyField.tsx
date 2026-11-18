import { DIFFICULTY_CONFIG, DIFFICULTY_VALUES, type Difficulty } from '@entities/question';
import { Button } from '@shared/ui/Button';

import { selectedVariant } from '../../lib/selectedVariant';
import { styles } from './LearnSetup.styles';

interface DifficultyFieldProps {
  selected: Difficulty[];
  onToggle: (difficulty: Difficulty) => void;
  onClear: () => void;
}

export function DifficultyField({ selected, onToggle, onClear }: DifficultyFieldProps) {
  return (
    <div>
      <label className={styles.fieldLabel}>난이도</label>
      <div className={styles.difficultyOptions}>
        <Button
          variant={selectedVariant(selected.length === 0)}
          size="sm"
          onClick={onClear}
          className={styles.difficultyOption}
        >
          전체
        </Button>
        {DIFFICULTY_VALUES.map((difficulty) => (
          <Button
            key={difficulty}
            variant={selectedVariant(selected.includes(difficulty))}
            size="sm"
            onClick={() => onToggle(difficulty)}
            className={styles.difficultyOption}
          >
            {DIFFICULTY_CONFIG[difficulty].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
