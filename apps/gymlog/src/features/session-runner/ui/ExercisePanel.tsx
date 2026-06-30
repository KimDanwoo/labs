'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { EQUIPMENT } from '@entities/exercise/model/types';
import { SET_STATUS, type ExercisePerformance } from '@entities/session/model/types';
import { MUSCLE_GROUP } from '@shared/training';
import { Badge, Button } from '@ui/react';
import { useState } from 'react';
import { AlternativeList } from './AlternativeList';
import { SetTable } from './SetTable';

type ExercisePanelProps = {
  performance: ExercisePerformance;
  onUpdateSet: (setIndex: number, patch: { reps: number; weight: number }) => void;
  onRemoveSet: (setIndex: number) => void;
  onAddSet: () => void;
  onStartRest: () => void;
  onFinish: () => void;
  onBack: () => void;
  onSubstitute: (alternativeId: string) => void;
};

export function ExercisePanel({
  performance,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onStartRest,
  onFinish,
  onBack,
  onSubstitute,
}: ExercisePanelProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const exercise = getExerciseById(performance.exerciseId);

  const handleSubstitute = (alternativeId: string) => {
    onSubstitute(alternativeId);
    setShowAlternatives(false);
  };

  // 무게 0으로 기록한 세트가 있으면 볼륨이 0이라 레벨·랭킹에 반영되지 않는다. 맨몸이 아니면 한 번 확인.
  const handleFinish = () => {
    const isBodyweight = exercise?.equipment === 'bodyweight';
    const hasZeroWeightLog = performance.sets.some(
      (set) => set.weight === 0 && (set.status === SET_STATUS.done || set.status === SET_STATUS.partial),
    );
    if (hasZeroWeightLog && !isBodyweight) {
      if (
        !window.confirm('무게 0kg으로 기록된 세트가 있어요. 무게 운동이면 무게를 입력해 주세요. 이대로 완료할까요?')
      ) {
        return;
      }
    }
    onFinish();
  };

  return (
    <div className="flex flex-col gap-lg">
      <button type="button" onClick={onBack} className="self-start text-sm text-muted hover:text-foreground">
        ← 목록
      </button>

      <div className="flex flex-col gap-sm">
        <h1 className="text-2xl font-bold text-foreground">{exercise?.nameKo ?? performance.exerciseId}</h1>
        {exercise && (
          <div className="flex gap-sm">
            <Badge>{MUSCLE_GROUP[exercise.primaryMuscle]}</Badge>
            <Badge tone="secondary">{EQUIPMENT[exercise.equipment]}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-sm">
        <Button variant="ghost" className="h-10 self-start text-sm" onClick={() => setShowAlternatives((v) => !v)}>
          대체 운동 {showAlternatives ? '닫기' : '보기'}
        </Button>
        {showAlternatives && exercise && (
          <AlternativeList alternativeIds={exercise.alternativeIds} onSelect={handleSubstitute} />
        )}
      </div>

      <SetTable performance={performance} onUpdate={onUpdateSet} onRemoveSet={onRemoveSet} onAddSet={onAddSet} />

      <div className="flex flex-col gap-sm">
        <Button variant="ghost" className="h-10 w-full text-sm text-muted" onClick={onStartRest}>
          휴식 타이머 시작
        </Button>
        <Button className="h-12 w-full" onClick={handleFinish}>
          운동 완료
        </Button>
      </div>
    </div>
  );
}
