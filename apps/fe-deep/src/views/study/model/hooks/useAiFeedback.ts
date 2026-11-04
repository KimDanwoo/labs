'use client';

import { useQuery } from '@tanstack/react-query';

export type AiFeedbackInput = { question: string; modelAnswer: string; recall: string };

async function requestAiFeedback(input: AiFeedbackInput): Promise<string> {
  const response = await fetch('/api/ai-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => null)) as { feedback?: string; error?: string } | null;
  if (!response.ok || !body?.feedback) {
    throw new Error(body?.error ?? 'AI 피드백 요청에 실패했습니다.');
  }
  return body.feedback;
}

/**
 * 답변 피드백을 받는다. dev 전용 — 프로덕션에서는 enabled가 꺼져 요청 자체가 없다.
 * 같은 질문+답변 조합은 캐시되어 카드를 다시 방문해도 재요청하지 않는다.
 */
export function useAiFeedback(input: AiFeedbackInput) {
  return useQuery({
    queryKey: ['ai-feedback', input.question, input.recall],
    queryFn: () => requestAiFeedback(input),
    enabled: process.env.NODE_ENV === 'development',
    staleTime: Infinity,
    retry: false,
  });
}
