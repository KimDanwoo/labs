import { DIFFICULTY_CONFIG, DIFFICULTY_VALUES } from '@entities/question';
import { Button } from '@shared/ui/Button';

import { selectedVariant } from '@views/learn/lib/selectedVariant';
import { useStudySetupContext } from '@views/learn/model/hooks/useStudySetupContext';
import { FieldLabel } from '@views/learn/ui/setup/FieldLabel';

export function StudySetupDifficulty() {
  const { settings, changeSettings, toggleDifficulty } = useStudySetupContext();
  const selected = settings.difficulties;

  return (
    <div>
      <FieldLabel>난이도</FieldLabel>
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant={selectedVariant(selected.length === 0)}
          size="sm"
          onClick={() => changeSettings({ difficulties: [] })}
          className="transition-all duration-200"
        >
          전체
        </Button>
        {DIFFICULTY_VALUES.map((difficulty) => (
          <Button
            key={difficulty}
            variant={selectedVariant(selected.includes(difficulty))}
            size="sm"
            onClick={() => toggleDifficulty(difficulty)}
            className="transition-all duration-200"
          >
            {DIFFICULTY_CONFIG[difficulty].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
