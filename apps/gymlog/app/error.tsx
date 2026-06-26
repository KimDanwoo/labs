'use client';

import { Button } from '@ui/react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-content flex-col items-center justify-center gap-lg px-lg py-3xl text-center">
      <div className="flex flex-col gap-sm">
        <h1 className="font-display text-2xl font-bold text-foreground">문제가 생겼어요</h1>
        <p className="text-sm text-muted">잠시 후 다시 시도해 주세요.</p>
      </div>
      <Button className="h-12 w-full" onClick={reset}>
        다시 시도
      </Button>
    </main>
  );
}
