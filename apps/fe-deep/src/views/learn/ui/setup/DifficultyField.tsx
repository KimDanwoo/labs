import { DIFFICULTY_CONFIG, DIFFICULTY_VALUES, type Difficulty } from '@entities/question';
import { Button } from '@shared/ui/Button';
import { FieldLabel } from './FieldLabel';

import { selectedVariant } from '../../lib/selectedVariant';

interface DifficultyFieldProps {
  selected: Difficulty[];
  onToggle: (difficulty: Difficulty) => void;
  onClear: () => void;
}

export function DifficultyField({ selected, onToggle, onClear }: DifficultyFieldProps) {
  return (
    <div>
      <FieldLabel>난이도</FieldLabel>
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant={selectedVariant(selected.length === 0)}
          size="sm"
          onClick={onClear}
          className="transition-all duration-200"
        >
          전체
        </Button>
        {DIFFICULTY_VALUES.map((difficulty) => (
          <Button
            key={difficulty}
            variant={selectedVariant(selected.includes(difficulty))}
            size="sm"
            onClick={() => onToggle(difficulty)}
            className="transition-all duration-200"
          >
            {DIFFICULTY_CONFIG[difficulty].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
