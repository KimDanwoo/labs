'use client';

import { formatClock } from '@shared/lib';
import { Button } from '@ui/react';

type RestTimerProps = {
  restSecondsLeft: number;
  nextSetIndex: number;
  onAddRest: (seconds: number) => void;
  onSkipRest: () => void;
};

export function RestTimer({ restSecondsLeft, nextSetIndex, onAddRest, onSkipRest }: RestTimerProps) {
  return (
    <div className="flex flex-col items-center gap-xl">
      <div className="flex flex-col items-center gap-sm">
        <span className="text-sm font-medium tracking-widest text-muted uppercase">Rest</span>
        <span className="font-display text-7xl font-bold tabular-nums text-foreground">
          {formatClock(restSecondsLeft)}
        </span>
        <span className="text-sm text-muted">다음: {nextSetIndex}번째 세트</span>
      </div>

      <div className="flex gap-md">
        <Button variant="outline" className="h-12 px-lg" onClick={() => onAddRest(15)}>
          +15초
        </Button>
        <Button variant="secondary" className="h-12 px-lg" onClick={onSkipRest}>
          건너뛰기
        </Button>
      </div>
    </div>
  );
}
