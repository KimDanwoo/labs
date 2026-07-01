'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@shared/config/supabase/client';
import { createFeedback } from '../actions';
import type { FeedbackType, SubmitStatus } from '../types';

interface UseFeedbackFormOptions {
  questionId?: string;
  fixedType?: FeedbackType;
}

/**
 * 피드백 폼의 로그인 확인, 입력 상태, 제출 로직을 관리한다.
 * 로그인하지 않은 경우 isLoggedIn이 false로 반환된다.
 */
export function useFeedbackForm({ questionId, fixedType }: UseFeedbackFormOptions) {
  const defaultType: FeedbackType = fixedType ?? (questionId ? 'edit_question' : 'add_question');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

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

  return { isLoggedIn, open, setOpen, type, setType, content, setContent, status, errorMsg, handleSubmit };
}
