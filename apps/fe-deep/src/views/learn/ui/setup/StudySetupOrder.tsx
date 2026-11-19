import { Button } from '@shared/ui/Button';

import { STUDY_ORDER_OPTIONS } from '../../config/setup';
import { selectedVariant } from '../../lib/selectedVariant';
import { useStudySetupContext } from '../../model/hooks/useStudySetupContext';
import { FieldLabel } from './FieldLabel';

export function StudySetupOrder() {
  const { settings, changeSettings } = useStudySetupContext();

  return (
    <div>
      <FieldLabel>순서</FieldLabel>
      <div className="grid grid-cols-2 gap-1.5">
        {STUDY_ORDER_OPTIONS.map(({ value: option, label, Icon }) => (
          <Button
            key={option}
            variant={selectedVariant(settings.order === option)}
            size="sm"
            onClick={() => changeSettings({ order: option })}
            className="gap-1.5 transition-all duration-200"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
