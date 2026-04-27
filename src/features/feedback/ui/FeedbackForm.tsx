'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/Button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/ui/Select';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/Sheet';
import { createClient } from '@/shared/config/supabase/client';
import { createFeedback, type FeedbackType } from '../actions';
import { MessageSquarePlus, Send } from 'lucide-react';

interface FeedbackFormProps {
  questionId?: string;
  questionText?: string;
  /** 타입을 고정하면 select가 숨겨진다 */
  fixedType?: FeedbackType;
  label?: string;
}

export function FeedbackForm({ questionId, questionText, fixedType, label }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const defaultType = fixedType ?? (questionId ? 'edit_question' : 'add_question');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      await createFeedback({ type, content: content.trim(), questionId });
      setStatus('success');
      setContent('');
      setTimeout(() => { setOpen(false); setStatus('idle'); }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '제출에 실패했습니다.');
      setStatus('error');
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
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
                  <SelectItem value="add_question">질문 추가 요청</SelectItem>
                  <SelectItem value="edit_question">질문 수정 요청</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {fixedType === 'add_question' ? '질문 추가 요청' : '질문 수정 요청'}
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
