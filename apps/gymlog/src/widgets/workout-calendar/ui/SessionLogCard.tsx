'use client';

import { summarizeSession } from '@entities/session/model/lib';
import { SESSION_STATUS, type WorkoutSession } from '@entities/session/model/types';
import { formatDuration, formatNumber, formatTime } from '@shared/lib';
import { Badge } from '@ui/react';
import * as Card from '@ui/react/card';

type SessionLogCardProps = {
  session: WorkoutSession;
};

export function SessionLogCard({ session }: SessionLogCardProps) {
  const summary = summarizeSession(session);
  const isDone = session.status === SESSION_STATUS.done;

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{session.routineName}</Card.Title>
        <Badge tone={isDone ? 'success' : 'warning'}>{isDone ? '완료' : '중단'}</Badge>
      </Card.Header>
      <Card.Description>{formatTime(new Date(session.startedAt))} 시작</Card.Description>
      <Card.Body>
        <div className="grid grid-cols-3 gap-sm text-center">
          <div className="flex flex-col gap-xs">
            <span className="text-lg font-semibold text-foreground">{summary.completedSets}</span>
            <span className="text-xs text-muted">세트</span>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-lg font-semibold text-foreground">{formatNumber(summary.totalVolumeKg)}</span>
            <span className="text-xs text-muted">볼륨(kg)</span>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-lg font-semibold text-foreground">{formatDuration(summary.durationSec)}</span>
            <span className="text-xs text-muted">소요</span>
          </div>
        </div>
      </Card.Body>
    </Card.Root>
  );
}
