'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { summarizeSession } from '@entities/session/model/lib';
import { SET_STATUS, type WorkoutSession } from '@entities/session/model/types';
import { formatDuration, formatNumber } from '@shared/lib';
import { Button } from '@ui/react';
import * as Card from '@ui/react/card';

type SessionSummaryCardProps = {
  session: WorkoutSession;
  onCommit: () => void;
};

export function SessionSummaryCard({ session, onCommit }: SessionSummaryCardProps) {
  const summary = summarizeSession(session);

  return (
    <div className="flex flex-col gap-lg">
      <Card.Root>
        <Card.Header>
          <Card.Title>운동 완료!</Card.Title>
          <Card.Description>{session.routineName}</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-2 gap-sm">
            <StatItem label="총 운동 수" value={`${summary.exerciseCount}개`} />
            <StatItem label="총 세트" value={`${summary.completedSets}세트`} />
            <StatItem label="총 횟수" value={`${summary.totalReps}회`} />
            <StatItem label="총 볼륨" value={`${formatNumber(summary.totalVolumeKg)}kg`} />
            <StatItem label="총 휴식" value={formatDuration(summary.totalRestSec)} />
            <StatItem label="총 소요" value={formatDuration(summary.durationSec)} />
          </div>
        </Card.Body>
      </Card.Root>

      <div className="flex flex-col gap-sm">
        {session.performances.map((performance, i) => {
          const exercise = getExerciseById(performance.exerciseId);
          const doneSets = performance.sets.filter(
            (s) => s.status === SET_STATUS.done || s.status === SET_STATUS.partial,
          );

          return (
            <Card.Root key={i}>
              <Card.Header>
                <Card.Title className="text-base">{exercise?.nameKo ?? performance.exerciseId}</Card.Title>
              </Card.Header>
              <Card.Body>
                {doneSets.length === 0 ? (
                  <p className="text-sm text-muted">완료한 세트 없음</p>
                ) : (
                  <ul className="flex flex-col gap-xs">
                    {doneSets.map((set, j) => (
                      <li key={j} className="flex justify-between text-sm">
                        <span className="text-muted">{j + 1}세트</span>
                        <span className="font-medium text-foreground">
                          {set.reps}회 × {set.weight}kg
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card.Root>
          );
        })}
      </div>

      <Button className="h-14 w-full text-base font-semibold" onClick={onCommit}>
        기록 저장하고 종료
      </Button>
    </div>
  );
}

type StatItemProps = {
  label: string;
  value: string;
};

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-xs rounded-md bg-primary-subtle p-md">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-display text-xl font-semibold text-foreground">{value}</span>
    </div>
  );
}
