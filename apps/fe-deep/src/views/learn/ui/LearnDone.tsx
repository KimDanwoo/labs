'use client';

import { Flame, Trophy } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@shared/ui/Button';

import { styles } from './LearnDone.styles';

interface LearnDoneProps {
  questionCount: number;
  streak: number;
  onRestart: () => void;
}

export function LearnDone({ questionCount, streak, onRestart }: LearnDoneProps) {
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <Trophy className={styles.trophy} />
        <h1 className={styles.title}>학습 완료!</h1>
        <p className={styles.summary}>{questionCount}문제를 모두 학습했습니다.</p>

        {streak > 0 && (
          <div className={styles.streak}>
            <Flame className={styles.streakIcon} />
            <span className={styles.streakText}>{streak}일 연속 학습 중!</span>
          </div>
        )}

        <div className={styles.actions}>
          <Button onClick={onRestart} variant="outline" className={styles.restart}>
            다시 학습하기
          </Button>
          <Button variant="ghost" className={styles.progressLink} asChild>
            <Link href="/mypage/progress">학습 현황 보기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
