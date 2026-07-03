'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import type { DayPlan } from '@entities/profile/model/types';
import type { Routine } from '@entities/routine/model/types';
import { Badge, Button, Card } from '@ui/react';

type TodayWorkoutProps = {
  weekdayLabel: string;
  dayPlan: DayPlan;
  routine: Routine | null;
  onStart: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onPickFree: () => void;
};

const previewExercises = (routine: Routine): string =>
  routine.items
    .map((item) => getExerciseById(item.exerciseId)?.nameKo)
    .filter((name): name is string => Boolean(name))
    .join(' · ');

export function TodayWorkout({ weekdayLabel, dayPlan, routine, onStart, onEdit, onPickFree }: TodayWorkoutProps) {
  if (dayPlan.type === 'rest') {
    return (
      <Card>
        <Card.Header>
          <Badge variant="secondary">{weekdayLabel}요일</Badge>
        </Card.Header>
        <Card.Title>오늘은 쉬는 날이에요 💤</Card.Title>
        <Card.Description>회복도 운동의 일부예요. 그래도 하고 싶다면 골라서 시작할 수 있어요.</Card.Description>
        <Card.Content>
          <Button variant="outline" className="h-12 w-full" onClick={onPickFree}>
            그래도 운동하기
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (dayPlan.type === 'free' || !routine) {
    return (
      <Card>
        <Card.Header>
          <Badge>{weekdayLabel}요일 · 자율</Badge>
        </Card.Header>
        <Card.Title>오늘은 자유롭게 🎯</Card.Title>
        <Card.Description>하고 싶은 루틴을 골라서 시작하세요.</Card.Description>
        <Card.Content>
          <Button className="h-12 w-full" onClick={onPickFree}>
            루틴 고르기
          </Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <section className="flex flex-col gap-md">
      <Card>
        <Card.Header>
          <Badge>오늘 · {weekdayLabel}요일</Badge>
        </Card.Header>
        <Card.Title className="text-2xl">{routine.name}</Card.Title>
        <Card.Description>
          {routine.items.length}개 운동 · {previewExercises(routine)}
        </Card.Description>
        <Card.Content className="flex flex-col gap-sm">
          <Button className="h-12 w-full" onClick={() => onStart(routine)}>
            운동 시작
          </Button>
          <Button variant="outline" className="h-11 w-full" onClick={() => onEdit(routine)}>
            운동 편집 (빼거나 추가)
          </Button>
        </Card.Content>
      </Card>
    </section>
  );
}
