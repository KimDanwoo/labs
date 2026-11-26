import type { SubmitEvent } from 'react';

import { WORD_MAX_LENGTH } from '@views/game-library/config/quickWords';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface QuickWordFormProps {
  value: string;
  isFinished: boolean;
  onChange: (word: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export function QuickWordForm({ value, isFinished, onChange, onSubmit }: QuickWordFormProps) {
  return (
    <form className={styles.wordForm} onSubmit={onSubmit}>
      <input
        type="text"
        aria-label="단어 퀴즈 정답"
        placeholder="정답 한 단어"
        maxLength={WORD_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isFinished}
      />
      <button type="submit" disabled={isFinished}>
        확인
      </button>
    </form>
  );
}
