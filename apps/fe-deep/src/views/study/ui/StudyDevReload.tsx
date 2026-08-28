'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 1_500;

async function fetchStamp(): Promise<number> {
  const response = await fetch('/api/study-mtime');
  if (!response.ok) throw new Error('stamp fetch failed');
  const body = (await response.json()) as { stamp: number };
  return body.stamp;
}

/** dev 전용 — 학습 md 저장을 감지해 화면을 자동 갱신한다. 프로덕션에선 아무것도 하지 않는다. */
export function StudyDevReload() {
  const router = useRouter();
  const lastStampRef = useRef<number | null>(null);

  const { data: stamp } = useQuery({
    queryKey: ['study-mtime'],
    queryFn: fetchStamp,
    enabled: process.env.NODE_ENV === 'development',
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  useEffect(() => {
    if (stamp === undefined) return;
    if (lastStampRef.current !== null && lastStampRef.current !== stamp) router.refresh();
    lastStampRef.current = stamp;
  }, [stamp, router]);

  return null;
}
