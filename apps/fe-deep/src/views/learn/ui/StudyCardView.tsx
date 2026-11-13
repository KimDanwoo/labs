'use client';

import { type FollowUp, type Question, DifficultyBadge } from '@entities/question';
import { cn } from '@shared/lib/cn';
import { KeywordCheck } from '@shared/ui/KeywordCheck';
import { MarkdownRenderer } from '@shared/ui/MarkdownRenderer';
import { Badge, Button, Card, Progress } from '@ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, RotateCcw, SkipForward } from 'lucide-react';

interface StudyCardViewProps {
  currentIndex: number;
  totalCount: number;
  currentQuestion: Question | undefined;
  currentFollowUp: FollowUp | undefined;
  stepIndex: number;
  stepCount: number;
  isFlipped: boolean;
  onFlip: () => void;
  progressPercent: number;
  isNewCard: boolean;
  onNext: () => void;
  onSkip: () => void;
  onRetry: () => void;
  recallInput: string;
  onRecallChange: (v: string) => void;
  headerAction?: React.ReactNode;
}

export function StudyCardView({
  currentIndex,
  totalCount,
  currentQuestion,
  currentFollowUp,
  stepIndex,
  stepCount,
  isFlipped,
  onFlip,
  progressPercent,
  isNewCard,
  onNext,
  onSkip,
  onRetry,
  recallInput,
  onRecallChange,
  headerAction,
}: StudyCardViewProps) {
  const prompt = currentFollowUp?.question ?? currentQuestion?.question ?? '';
  const answer = currentFollowUp?.answer ?? currentQuestion?.answer ?? '';
  const keywords = currentFollowUp?.keywords ?? currentQuestion?.tags ?? [];
  const isLastStep = stepIndex + 1 >= stepCount;

  const handleRecallKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div className="container mx-auto max-w-168 px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal tabular-nums text-muted-foreground">
              {currentIndex + 1} / {totalCount}
            </span>
            {isNewCard && (
              <Badge variant="secondary" className="text-xs">
                NEW
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isFlipped && <span className="text-xs text-muted-foreground/70">Space 또는 ⌘/Ctrl+Enter</span>}
            {isFlipped && <span className="text-xs text-muted-foreground/70">Space/Enter로 다음</span>}
            {headerAction}
          </div>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${stepIndex}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="min-h-[300px] p-6 relative shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              {currentFollowUp ? (
                <Badge className="text-xs">꼬꼬무</Badge>
              ) : (
                <DifficultyBadge difficulty={currentQuestion?.difficulty ?? 'easy'} />
              )}
              {!currentFollowUp && currentQuestion?.sub_category && (
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.sub_category}
                </Badge>
              )}
              {stepCount > 1 && (
                <div
                  className="ml-auto flex items-center gap-1.5"
                  aria-label={`${stepIndex + 1}단계 / 총 ${stepCount}단계`}
                >
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
              )}
            </div>

            <div className="flex flex-col items-center justify-center min-h-[120px] mb-6">
              <p className="text-lg font-normal text-center leading-relaxed whitespace-pre-line">{prompt}</p>
            </div>

            {keywords.length > 0 && !(isFlipped && recallInput.trim()) && (
              <details className="mb-5">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  키워드 힌트 보기 ({keywords.length})
                </summary>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.map((keyword) => (
                    <li key={keyword} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {keyword}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {!isFlipped ? (
              <div>
                <label htmlFor="recall-input" className="block text-sm text-muted-foreground mb-2">
                  답을 떠올려 적어보세요
                </label>
                <textarea
                  id="recall-input"
                  value={recallInput}
                  onChange={(e) => onRecallChange(e.target.value)}
                  onKeyDown={handleRecallKeyDown}
                  placeholder="키워드만 적어도 됩니다. 비워둬도 넘어갈 수 있어요."
                  rows={3}
                  className="w-full resize-y rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="border-t border-border/50 pt-5 space-y-5">
                  {recallInput.trim() && (
                    <div className="rounded-lg bg-muted/40 p-4">
                      <p className="text-xs font-normal text-muted-foreground mb-2">내 답변</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{recallInput}</p>
                    </div>
                  )}
                  {recallInput.trim() && keywords.length > 0 && (
                    <KeywordCheck keywords={keywords} recall={recallInput} />
                  )}
                  <div>
                    <p className="text-xs font-normal text-muted-foreground mb-2">모범 답변</p>
                    <MarkdownRenderer content={answer} />
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="lg" onClick={onRetry} disabled={!isFlipped} className="gap-2 shadow-sm">
          <RotateCcw className="h-4 w-4" />
          다시 풀기
        </Button>
        <Button size="lg" onClick={isFlipped ? onNext : onFlip} className="flex-1 gap-2 shadow-md">
          {isFlipped ? (
            <>
              {isLastStep ? '다음' : '꼬꼬무'}
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              답변 확인
            </>
          )}
        </Button>
        <Button variant="ghost" size="lg" onClick={onSkip} className="gap-2">
          건너뛰기
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
