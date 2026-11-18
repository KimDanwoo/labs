import type { KeyboardEvent } from 'react';

import { isSubmitShortcut } from '@shared/lib/isSubmitShortcut';

import { STUDY_RECALL_ID, STUDY_RECALL_ROWS } from '../../config/step';
import { styles } from './StepCard.styles';

interface StepRecallInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function StepRecallInput({ value, onChange, onSubmit }: StepRecallInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.input}>
      <label htmlFor={STUDY_RECALL_ID} className={styles.inputLabel}>
        먼저 소리 내어 말해보세요. 키워드만 메모해도 됩니다.
      </label>
      <textarea
        id={STUDY_RECALL_ID}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="비워둬도 넘어갈 수 있어요. (⌘/Ctrl + Enter로 답 확인)"
        rows={STUDY_RECALL_ROWS}
        className={styles.textarea}
      />
    </div>
  );
}
