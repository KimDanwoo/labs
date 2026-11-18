import type { KeyboardEvent } from 'react';

import { RECALL_INPUT_ID, RECALL_INPUT_ROWS } from '../../config/studyCard';
import { isSubmitShortcut } from '../../lib/isSubmitShortcut';
import { styles } from './StudyCardView.styles';

interface RecallInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function RecallInput({ value, onChange, onSubmit }: RecallInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    onSubmit();
  };

  return (
    <div>
      <label htmlFor={RECALL_INPUT_ID} className={styles.recallLabel}>
        답을 떠올려 적어보세요
      </label>
      <textarea
        id={RECALL_INPUT_ID}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="키워드만 적어도 됩니다. 비워둬도 넘어갈 수 있어요."
        rows={RECALL_INPUT_ROWS}
        className={styles.recallInput}
      />
    </div>
  );
}
