import { Button } from '@shared/ui/Button';
import { FieldLabel } from './FieldLabel';

import { STUDY_ORDER_OPTIONS } from '../../config/setup';
import { selectedVariant } from '../../lib/selectedVariant';
import type { StudyOrder } from '../../model/constants/study';

interface OrderFieldProps {
  value: StudyOrder;
  onChange: (order: StudyOrder) => void;
}

export function OrderField({ value, onChange }: OrderFieldProps) {
  return (
    <div>
      <FieldLabel>순서</FieldLabel>
      <div className="grid grid-cols-2 gap-1.5">
        {STUDY_ORDER_OPTIONS.map(({ value: option, label, Icon }) => (
          <Button
            key={option}
            variant={selectedVariant(value === option)}
            size="sm"
            onClick={() => onChange(option)}
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
