'use client';

import { createClient } from '@shared/api/supabaseClient';
import { useEffect, useState } from 'react';
import { createFeedback } from '../actions/feedbackActions';
import type { FeedbackType, SubmitStatus } from '../types/types';

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
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '제출에 실패했습니다.');
      setStatus('error');
    }
  };

  return { isLoggedIn, open, setOpen, type, setType, content, setContent, status, errorMsg, handleSubmit };
}
