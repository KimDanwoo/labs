import type { KeyboardEvent } from 'react';

import { isSubmitShortcut } from '@shared/lib/isSubmitShortcut';
import { RECALL_INPUT_ID, RECALL_INPUT_ROWS } from '../../config/studyCard';

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
      <label htmlFor={RECALL_INPUT_ID} className="block text-sm text-muted-foreground mb-2">
        답을 떠올려 적어보세요
      </label>
      <textarea
        id={RECALL_INPUT_ID}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="키워드만 적어도 됩니다. 비워둬도 넘어갈 수 있어요."
        rows={RECALL_INPUT_ROWS}
        className="w-full resize-y rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}
