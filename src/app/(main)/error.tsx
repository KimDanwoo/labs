'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { RotateCcw, ArrowLeft } from 'lucide-react';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-24 text-center animate-fade-in-up">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-2xl">!</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">문제가 발생했습니다</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset} className="gap-2 shadow-md">
          <RotateCcw className="h-4 w-4" />
          다시 시도
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
        </Button>
      </div>
    </div>
  );
}
