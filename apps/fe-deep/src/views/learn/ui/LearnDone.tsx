'use client';

import { Button } from '@ui/react';
import { Flame, Trophy } from 'lucide-react';
import Link from 'next/link';

type LearnDoneProps = {
  questionCount: number;
  streak: number;
  onRestart: () => void;
};

export function LearnDone({ questionCount, streak, onRestart }: LearnDoneProps) {
  return (
    <div className="container mx-auto max-w-168 px-4 py-8 sm:py-12 animate-fade-in-up">
      <div className="text-center py-16">
        <Trophy className="h-16 w-16 text-highlight mx-auto mb-5" />
        <h1 className="text-3xl font-bold tracking-tight mb-3">학습 완료!</h1>
        <p className="text-muted-foreground mb-6">{questionCount}문제를 모두 학습했습니다.</p>

        {streak > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-streak/10 border border-streak/20 px-4 py-2 mb-8">
            <Flame className="h-5 w-5 text-streak" />
            <span className="text-lg font-bold">{streak}일 연속 학습 중!</span>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={onRestart} variant="outline" className="gap-2 shadow-sm">
            다시 학습하기
          </Button>
          <Button variant="ghost" className="gap-2" asChild>
            <Link href="/mypage/progress">학습 현황 보기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
