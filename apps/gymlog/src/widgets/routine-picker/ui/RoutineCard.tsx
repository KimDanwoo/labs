'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import type { Routine } from '@entities/routine/model/types';
import { GOAL } from '@shared/training';
import { Badge, Button, Card } from '@ui/react';

type Props = {
  routine: Routine;
  onStart: (routine: Routine) => void;
};

function buildPreview(routine: Routine): string {
  const names: string[] = [];
  for (const item of routine.items.slice(0, 3)) {
    const exercise = getExerciseById(item.exerciseId);
    if (exercise) {
      names.push(exercise.nameKo);
    }
  }
  return names.join(' · ');
}

export function RoutineCard({ routine, onStart }: Props) {
  const preview = buildPreview(routine);

  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col gap-xs">
          <Card.Title>{routine.name}</Card.Title>
          <Card.Description>{routine.dayLabel}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-sm">
        <div className="flex flex-wrap gap-xs">
          <Badge variant="primary">{GOAL[routine.goal]}</Badge>
          <Badge variant="secondary">{routine.items.length}개 운동</Badge>
        </div>
        {preview && <p className="text-sm text-muted-foreground">{preview}</p>}
      </Card.Content>
      <Card.Footer>
        <Button className="w-full" onClick={() => onStart(routine)}>
          시작
        </Button>
      </Card.Footer>
    </Card>
  );
}
