'use client';

import { Button } from '@ui/react';
import { useState } from 'react';
import { RepStepper } from './RepStepper';
import { WeightStepper } from './WeightStepper';

type SetInputProps = {
  suggestedWeight: number;
  suggestedReps: number;
  onLog: (input: { reps: number; weight: number }) => void;
  onSkip: () => void;
  onAddSet: () => void;
  onFinish: () => void;
};

export function SetInput({ suggestedWeight, suggestedReps, onLog, onSkip, onAddSet, onFinish }: SetInputProps) {
  const [weight, setWeight] = useState(suggestedWeight);
  const [reps, setReps] = useState(suggestedReps);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg shadow-md">
        <p className="text-sm font-medium text-muted">무게</p>
        <WeightStepper value={weight} onChange={setWeight} />
      </div>

      <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg shadow-md">
        <p className="text-sm font-medium text-muted">횟수</p>
        <RepStepper value={reps} onChange={setReps} />
      </div>

      <div className="flex flex-col gap-sm">
        <Button className="h-14 w-full text-base font-semibold" onClick={() => onLog({ reps, weight })}>
          세트 완료
        </Button>
        <div className="flex gap-sm">
          <Button variant="outline" className="h-12 flex-1" onClick={onSkip}>
            세트 건너뛰기
          </Button>
          <Button variant="outline" className="h-12 flex-1" onClick={onAddSet}>
            세트 추가
          </Button>
        </div>
        <Button variant="ghost" className="h-10 w-full text-sm text-muted" onClick={onFinish}>
          이 운동 그만
        </Button>
      </div>
    </div>
  );
}
