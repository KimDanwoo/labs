'use client';

import type { ExercisePerformance } from '@entities/session/model/types';
import { SetHistoryList } from './SetHistoryList';
import { SetInput } from './SetInput';

type SetBoardProps = {
  performance: ExercisePerformance;
  currentSetIndex: number;
  setTotal: number;
  suggestedWeight: number;
  suggestedReps: number;
  onLog: (input: { reps: number; weight: number }) => void;
  onSkip: () => void;
  onAddSet: () => void;
  onFinish: () => void;
};

export function SetBoard({
  performance,
  currentSetIndex,
  setTotal,
  suggestedWeight,
  suggestedReps,
  onLog,
  onSkip,
  onAddSet,
  onFinish,
}: SetBoardProps) {
  return (
    <div className="flex flex-col gap-lg">
      <p className="text-base font-semibold text-foreground">
        {currentSetIndex + 1}번째 세트 / 총 {setTotal}
      </p>

      <SetHistoryList sets={performance.sets} currentSetIndex={currentSetIndex} />

      <SetInput
        key={currentSetIndex}
        suggestedWeight={suggestedWeight}
        suggestedReps={suggestedReps}
        onLog={onLog}
        onSkip={onSkip}
        onAddSet={onAddSet}
        onFinish={onFinish}
      />
    </div>
  );
}
