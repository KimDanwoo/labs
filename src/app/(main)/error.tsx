'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold mb-4">문제가 발생했습니다</h1>
      <p className="text-muted-foreground mb-8">
        페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="outline" asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
