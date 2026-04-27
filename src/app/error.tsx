'use client';

import { Button } from '@/shared/ui/Button';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">!</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">오류가 발생했습니다</h1>
          <p className="text-muted-foreground leading-relaxed">
            예기치 못한 문제가 생겼습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
        <Button onClick={reset} className="gap-2 shadow-md">
          <RotateCcw className="h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}
