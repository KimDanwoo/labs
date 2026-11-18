import { Button } from '@shared/ui/Button';

import { STUDY_ORDER_OPTIONS } from '../../config/setup';
import { selectedVariant } from '../../lib/selectedVariant';
import type { StudyOrder } from '../../model/constants/study';
import { styles } from './LearnSetup.styles';

interface OrderFieldProps {
  value: StudyOrder;
  onChange: (order: StudyOrder) => void;
}

export function OrderField({ value, onChange }: OrderFieldProps) {
  return (
    <div>
      <label className={styles.fieldLabel}>순서</label>
      <div className={styles.orderOptions}>
        {STUDY_ORDER_OPTIONS.map(({ value: option, label, Icon }) => (
          <Button
            key={option}
            variant={selectedVariant(value === option)}
            size="sm"
            onClick={() => onChange(option)}
            className={styles.orderOption}
          >
            <Icon className={styles.orderIcon} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
