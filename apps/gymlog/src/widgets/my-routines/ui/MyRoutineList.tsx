'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import type { Routine } from '@entities/routine/model/types';
import { GOAL } from '@shared/training';
import { Badge, Button } from '@ui/react';
import * as Card from '@ui/react/card';

type MyRoutineListProps = {
  routines: Routine[];
  onStart: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete?: (routine: Routine) => void;
  editLabel?: string;
};

const previewExercises = (routine: Routine): string =>
  routine.items
    .slice(0, 3)
    .map((item) => getExerciseById(item.exerciseId)?.nameKo)
    .filter((name): name is string => Boolean(name))
    .join(' · ');

export function MyRoutineList({ routines, onStart, onEdit, onDelete, editLabel }: MyRoutineListProps) {
  return (
    <div className="flex flex-col gap-md">
      {routines.map((routine) => (
        <Card.Root key={routine.id}>
          <Card.Header>
            <Card.Title>{routine.name}</Card.Title>
            <Badge>{GOAL[routine.goal]}</Badge>
          </Card.Header>
          <Card.Description>
            {routine.items.length}개 운동 · {previewExercises(routine)}
          </Card.Description>
          <Card.Body>
            <div className="flex gap-sm">
              <Button className="h-12 flex-1 font-semibold" onClick={() => onStart(routine)}>
                시작
              </Button>
              <Button variant="outline" className="h-12 px-lg" onClick={() => onEdit(routine)}>
                {editLabel ?? '편집'}
              </Button>
              {onDelete && (
                <Button variant="ghost" className="h-12 px-md text-sm text-error" onClick={() => onDelete(routine)}>
                  삭제
                </Button>
              )}
            </div>
          </Card.Body>
        </Card.Root>
      ))}
    </div>
  );
}
