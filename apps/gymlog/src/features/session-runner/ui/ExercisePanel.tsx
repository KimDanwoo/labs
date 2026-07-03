'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { EQUIPMENT } from '@entities/exercise/model/types';
import type { ExercisePerformance } from '@entities/session/model/types';
import { MUSCLE_GROUP } from '@shared/training';
import { Badge, Button } from '@ui/react';
import { useState } from 'react';
import { AlternativeList } from './AlternativeList';
import { RepsCell } from './RepsCell';
import { SetHistoryList } from './SetHistoryList';
import { WeightCell } from './WeightCell';

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
  const [weight, setWeight] = useState(suggestedWeight);
  const [reps, setReps] = useState(suggestedReps);
  const exercise = getExerciseById(performance.exerciseId);
  const isDone = currentSetIndex === -1;
  const setTotal = performance.sets.length;

  const handleSubstitute = (alternativeId: string) => {
    onSubstitute(alternativeId);
    setShowAlternatives(false);
  };

  // 무게 0으로 기록하면 볼륨이 0이라 레벨·랭킹에 반영되지 않는다. 맨몸 운동이 아니면 한 번 확인.
  const handleLog = () => {
    const isBodyweight = exercise?.equipment === 'bodyweight';
    if (weight === 0 && !isBodyweight) {
      if (!window.confirm('무게 0kg으로 기록할까요? 무게 운동이면 무게를 입력해 주세요.')) {
        return;
      }
    }
    onLog({ reps, weight });
  };

  return (
    <div className="flex flex-col gap-lg">
      <button type="button" onClick={onBack} className="self-start text-sm text-muted-foreground hover:text-foreground">
        ← 목록
      </button>

      <div className="flex flex-col gap-sm">
        <h1 className="text-2xl font-bold text-foreground">{exercise?.nameKo ?? performance.exerciseId}</h1>
        {exercise && (
          <div className="flex gap-sm">
            <Badge>{MUSCLE_GROUP[exercise.primaryMuscle]}</Badge>
            <Badge variant="secondary">{EQUIPMENT[exercise.equipment]}</Badge>
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

      {!isDone && (
        <p className="text-base font-semibold text-foreground">
          {currentSetIndex + 1}번째 세트 / 총 {setTotal}
        </p>
      )}

      <SetHistoryList sets={performance.sets} currentSetIndex={isDone ? setTotal : currentSetIndex} />

      {isDone ? (
        <p className="text-sm text-success">운동 완료!</p>
      ) : (
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg shadow-md">
            <p className="text-sm font-medium text-muted-foreground">무게 (kg)</p>
            <WeightCell
              key={`weight-${currentSetIndex}`}
              initial={suggestedWeight}
              ariaLabel={`${currentSetIndex + 1}세트 무게`}
              onCommit={setWeight}
            />
          </div>

          <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg shadow-md">
            <p className="text-sm font-medium text-muted-foreground">횟수</p>
            <RepsCell
              key={`reps-${currentSetIndex}`}
              initial={suggestedReps}
              ariaLabel={`${currentSetIndex + 1}세트 횟수`}
              onCommit={setReps}
            />
          </div>

          <Button className="h-14 w-full text-base font-semibold" onClick={handleLog}>
            세트 완료
          </Button>

          <div className="flex gap-sm">
            <Button variant="outline" className="h-11 flex-1 text-sm" onClick={onSkip}>
              이 세트 건너뛰기
            </Button>
            <Button variant="outline" className="h-11 flex-1 text-sm" onClick={onAddSet}>
              + 세트
            </Button>
          </div>

          <Button variant="ghost" className="h-10 w-full text-sm text-muted-foreground" onClick={onFinish}>
            운동 끝내기
          </Button>
        </div>
      )}
    </div>
  );
}
