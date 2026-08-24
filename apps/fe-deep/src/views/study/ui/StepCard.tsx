'use client';

import { cn } from '@shared/lib/utils';
import { Badge, Button, Card, MarkdownRenderer } from '@shared/ui';
import { Eye, Lightbulb } from 'lucide-react';
import { STEP_KIND, type StudyStep } from '../model';

/** 문서의 "꼬꼬무 공통 프레임" — 모범 답변이 없는 질문에서 스스로 정리할 때 쓴다. */
const ANSWER_FRAME = ['왜?', '대안?', '왜 안 골랐나?', '단점?', '결과?', '다시 한다면?'];

const STEP_LABEL: Record<StudyStep['kind'], string> = {
  [STEP_KIND.keywords]: '키워드만 보고 말하기',
  [STEP_KIND.answer]: '모범 답변',
  [STEP_KIND.followUp]: '꼬꼬무',
};

interface StepCardProps {
  step: StudyStep;
  stepIndex: number;
  stepCount: number;
  isRevealed: boolean;
  recall: string;
  onRecallChange: (value: string) => void;
  onReveal: () => void;
}

export function StepCard({ step, stepIndex, stepCount, isRevealed, recall, onRecallChange, onReveal }: StepCardProps) {
  const handleRecallKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      onReveal();
    }
  };

  return (
    <Card className="p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Badge variant={step.kind === STEP_KIND.followUp ? 'default' : 'secondary'} className="text-xs">
          {STEP_LABEL[step.kind]}
        </Badge>
        <div className="ml-auto flex items-center gap-1.5" aria-label={`${stepIndex + 1}단계 / 총 ${stepCount}단계`}>
          {Array.from({ length: stepCount }, (_, index) => (
            <span
              key={index}
              className={cn(
                'size-1.5 rounded-full transition-colors',
                index <= stepIndex ? 'bg-primary' : 'bg-muted-foreground/25',
              )}
            />
          ))}
        </div>
      </div>

      <p className="break-keep text-lg font-semibold leading-relaxed sm:text-xl">{step.prompt}</p>

      {step.keywords.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {step.keywords.map((keyword) => (
            <li key={keyword} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {keyword}
            </li>
          ))}
        </ul>
      )}

      {isRevealed ? (
        <div className="mt-6 space-y-5 border-t border-border/50 pt-5">
          {recall.trim() && (
            <div className="rounded-lg bg-muted/40 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">내가 말한 것</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{recall}</p>
            </div>
          )}
          {step.reveal ? (
            <MarkdownRenderer content={step.reveal} />
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0" />
              <p className="leading-relaxed">
                이 질문엔 정해진 답이 없습니다. 아래 순서로 직접 정리해보세요.
                <span className="mt-2 block font-medium text-foreground">{ANSWER_FRAME.join(' → ')}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <label htmlFor="study-recall" className="mb-2 block text-sm text-muted-foreground">
            먼저 소리 내어 말해보세요. 키워드만 메모해도 됩니다.
          </label>
          <textarea
            id="study-recall"
            value={recall}
            onChange={(event) => onRecallChange(event.target.value)}
            onKeyDown={handleRecallKeyDown}
            placeholder="비워둬도 넘어갈 수 있어요. (⌘/Ctrl + Enter로 답 확인)"
            rows={3}
            className="w-full resize-y rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button variant="outline" size="lg" onClick={onReveal} className="mt-4 w-full gap-2 sm:w-auto">
            <Eye className="size-4" />답 확인
          </Button>
        </div>
      )}
    </Card>
  );
}
