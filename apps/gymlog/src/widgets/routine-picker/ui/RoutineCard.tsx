'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import type { Routine } from '@entities/routine/model/types';
import { GOAL } from '@shared/training';
import { Badge, Button } from '@ui/react';
import * as Card from '@ui/react/card';

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
    <Card.Root>
      <Card.Header>
        <div className="flex flex-col gap-xs">
          <Card.Title>{routine.name}</Card.Title>
          <Card.Description>{routine.dayLabel}</Card.Description>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="flex flex-wrap gap-xs">
          <Badge tone="primary">{GOAL[routine.goal]}</Badge>
          <Badge tone="secondary">{routine.items.length}개 운동</Badge>
        </div>
        {preview && <p className="text-sm text-muted">{preview}</p>}
      </Card.Body>
      <Card.Footer>
        <Button className="w-full" onClick={() => onStart(routine)}>
          시작
        </Button>
      </Card.Footer>
    </Card.Root>
  );
}
