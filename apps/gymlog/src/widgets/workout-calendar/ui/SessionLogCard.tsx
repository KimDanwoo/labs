'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { summarizeSession } from '@entities/session/model/lib';
import { SESSION_STATUS, type WorkoutSession } from '@entities/session/model/types';
import { formatDuration, formatNumber, formatTime } from '@shared/lib';
import { Badge, Card } from '@ui/react';

type SessionLogCardProps = {
  session: WorkoutSession;
};

const PREVIEW_LIMIT = 3;

export function SessionLogCard({ session }: SessionLogCardProps) {
  const summary = summarizeSession(session);
  const isDone = session.status === SESSION_STATUS.done;
  const startedAt = new Date(session.startedAt);

  const names = session.performances
    .map((performance) => getExerciseById(performance.exerciseId)?.nameKo)
    .filter((name): name is string => Boolean(name));
  const preview = names.slice(0, PREVIEW_LIMIT).join(' · ');
  const extra = names.length > PREVIEW_LIMIT ? ` 외 ${names.length - PREVIEW_LIMIT}` : '';

  return (
    <Card>
      <Card.Header>
        <Card.Title>{session.routineName}</Card.Title>
        <Badge variant={isDone ? 'success' : 'warning'}>{isDone ? '완료' : '중단'}</Badge>
      </Card.Header>
      <Card.Description>
        {startedAt.getMonth() + 1}월 {startedAt.getDate()}일 · {formatTime(startedAt)}
      </Card.Description>
      <Card.Content>
        {preview && (
          <p className="truncate text-xs text-muted-foreground">
            {preview}
            {extra}
          </p>
        )}
        <div className="grid grid-cols-3 gap-sm text-center">
          <div className="flex flex-col gap-xs">
            <span className="text-lg font-semibold text-foreground">{summary.completedSets}</span>
            <span className="text-xs text-muted-foreground">세트</span>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-lg font-semibold text-foreground">{formatNumber(summary.totalVolumeKg)}</span>
            <span className="text-xs text-muted-foreground">볼륨(kg)</span>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-lg font-semibold text-foreground">{formatDuration(summary.durationSec)}</span>
            <span className="text-xs text-muted-foreground">소요</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
