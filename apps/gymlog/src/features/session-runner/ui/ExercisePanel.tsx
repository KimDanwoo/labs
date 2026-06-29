'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { EQUIPMENT } from '@entities/exercise/model/types';
import type { ExercisePerformance } from '@entities/session/model/types';
import { MUSCLE_GROUP } from '@shared/training';
import { Badge, Button } from '@ui/react';
import { useState } from 'react';
import { AlternativeList } from './AlternativeList';
import { SetBoard } from './SetBoard';
import { SetHistoryList } from './SetHistoryList';

type ExercisePanelProps = {
  performance: ExercisePerformance;
  currentSetIndex: number;
  suggestedWeight: number;
  suggestedReps: number;
  onLog: (input: { reps: number; weight: number }) => void;
  onSkip: () => void;
  onFinish: () => void;
  onAddSet: () => void;
  onBack: () => void;
  onSubstitute: (alternativeId: string) => void;
};

export function ExercisePanel({
  performance,
  currentSetIndex,
  suggestedWeight,
  suggestedReps,
  onLog,
  onSkip,
  onFinish,
  onAddSet,
  onBack,
  onSubstitute,
}: ExercisePanelProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const exercise = getExerciseById(performance.exerciseId);
  const isDone = currentSetIndex === -1;

  const handleSubstitute = (alternativeId: string) => {
    onSubstitute(alternativeId);
    setShowAlternatives(false);
  };

  // 무게 0으로 기록하면 볼륨이 0이라 레벨·랭킹에 반영되지 않는다. 맨몸 운동이 아니면 한 번 확인.
  const handleLog = (input: { reps: number; weight: number }) => {
    const isBodyweight = exercise?.equipment === 'bodyweight';
    if (input.weight === 0 && !isBodyweight) {
      if (!window.confirm('무게 0kg으로 기록할까요? 무게 운동이면 무게를 입력해 주세요.')) {
        return;
      }
    }
    onLog(input);
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

      {isDone ? (
        <div className="flex flex-col gap-lg">
          <SetHistoryList sets={performance.sets} currentSetIndex={performance.sets.length} />
          <div className="flex flex-col gap-sm">
            <Button className="h-12 w-full" onClick={onAddSet}>
              세트 추가
            </Button>
            <Button variant="outline" className="h-12 w-full" onClick={onBack}>
              목록으로
            </Button>
          </div>
        </div>
      ) : (
        <SetBoard
          performance={performance}
          currentSetIndex={currentSetIndex}
          setTotal={performance.sets.length}
          suggestedWeight={suggestedWeight}
          suggestedReps={suggestedReps}
          onLog={handleLog}
          onSkip={onSkip}
          onAddSet={onAddSet}
          onFinish={onFinish}
        />
      )}
    </div>
  );
}
