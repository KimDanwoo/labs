'use client';

import { createClient } from '@shared/api/supabaseClient';
import { useEffect, useRef, useState } from 'react';
import { createFeedback } from '../actions/feedbackActions';
import type { FeedbackType, SubmitStatus } from '../types/types';

const CLOSE_AFTER_SUCCESS_MS = 1500;

interface UseFeedbackFormOptions {
  questionId?: string;
  fixedType?: FeedbackType;
}

export function useFeedbackForm({ questionId, fixedType }: UseFeedbackFormOptions) {
  const defaultType: FeedbackType = fixedType ?? (questionId ? 'edit_question' : 'add_question');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    return () => clearTimeout(closeTimer.current);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    clearTimeout(closeTimer.current);
    setOpen(isOpen);
    if (status === 'submitting') return;
    setStatus('idle');
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      await createFeedback({ type, content: content.trim(), questionId });
      setStatus('success');
      setContent('');
      closeTimer.current = setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, CLOSE_AFTER_SUCCESS_MS);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '제출에 실패했습니다.');
      setStatus('error');
    }
  };

  return {
    isLoggedIn,
    open,
    setOpen: handleOpenChange,
    type,
    setType,
    content,
    setContent,
    status,
    errorMsg,
    handleSubmit,
  };
}
