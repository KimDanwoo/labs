import type { KeyboardEvent } from 'react';

import { isSubmitShortcut } from '@shared/lib/isSubmitShortcut';

import { STUDY_RECALL_ID, STUDY_RECALL_ROWS } from '../../config/step';

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
    <div className="mt-6">
      <label htmlFor={STUDY_RECALL_ID} className="mb-2 block text-sm text-muted-foreground">
        먼저 소리 내어 말해보세요. 키워드만 메모해도 됩니다.
      </label>
      <textarea
        id={STUDY_RECALL_ID}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="비워둬도 넘어갈 수 있어요. (⌘/Ctrl + Enter로 답 확인)"
        rows={STUDY_RECALL_ROWS}
        className="w-full resize-y rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}
