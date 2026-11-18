import { Lightbulb } from 'lucide-react';

import { ANSWER_FRAME, ANSWER_FRAME_SEPARATOR } from '../../config/step';

export function AnswerFramePrompt() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      <Lightbulb className="mt-0.5 size-4 shrink-0" />
      <p className="leading-relaxed">
        이 질문엔 정해진 답이 없습니다. 아래 순서로 직접 정리해보세요.
        <span className="mt-2 block font-normal text-foreground">{ANSWER_FRAME.join(ANSWER_FRAME_SEPARATOR)}</span>
      </p>
    </div>
  );
}
