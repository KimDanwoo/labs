'use client';

import { Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Sheet, SheetContent, SheetTitle } from '@shared/ui';
import { MessageSquarePlus, Send } from 'lucide-react';
import { useFeedbackForm } from '../model';
import { FEEDBACK_TYPE_LABELS } from '../constants';
import type { FeedbackType } from '../types';

interface FeedbackFormProps {
  questionId?: string;
  questionText?: string;
  /** 타입을 고정하면 select가 숨겨진다 */
  fixedType?: FeedbackType;
  label?: string;
  className?: string;
}

export function FeedbackForm({ questionId, questionText, fixedType, label, className }: FeedbackFormProps) {
  const { isLoggedIn, open, setOpen, type, setType, content, setContent, status, errorMsg, handleSubmit } =
    useFeedbackForm({ questionId, fixedType });

  if (!isLoggedIn) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`gap-1.5 text-muted-foreground${className ? ` ${className}` : ''}`}
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus className="size-3.5" />
        {label ?? '피드백'}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 max-w-lg mx-auto">
          <SheetTitle className="text-base font-semibold mb-4">피드백 보내기</SheetTitle>

          <div className="space-y-4">
            {questionText && (
              <p className="text-xs text-muted-foreground line-clamp-2 p-3 rounded-lg bg-muted/50">
                {questionText}
              </p>
            )}

            {!fixedType ? (
              <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {FEEDBACK_TYPE_LABELS[fixedType]}
              </p>
            )}

            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 resize-y"
              placeholder="어떤 내용을 추가/수정하면 좋을까요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={status === 'submitting'}
              autoFocus
            />

            {status === 'success' && (
              <p className="text-sm text-green-600">피드백이 제출되었습니다. 감사합니다!</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-destructive">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSubmit}
                disabled={!content.trim() || status === 'submitting'}
              >
                <Send className="size-3.5" />
                {status === 'submitting' ? '제출 중...' : '보내기'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
