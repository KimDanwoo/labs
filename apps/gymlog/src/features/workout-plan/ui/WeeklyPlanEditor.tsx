'use client';

import {
  DAY_PLAN_TYPE,
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_LABELS,
  getDayPlan,
  type DayPlan,
  type DayPlanType,
  type WeekPlan,
} from '@entities/profile/model/types';
import type { Routine } from '@entities/routine/model/types';
import { MUSCLE_GROUP, type MuscleGroup } from '@shared/training';
import { useState } from 'react';

type WeeklyPlanEditorProps = {
  weekPlan: WeekPlan;
  routines: Routine[];
  onChange: (weekday: number, dayPlan: DayPlan) => void;
};

const TYPE_LABEL: Record<DayPlanType, string> = { focus: '부위', routine: '내 루틴', free: '자율', rest: '휴식' };
const TYPE_OPTIONS = Object.keys(DAY_PLAN_TYPE) as DayPlanType[];
const MUSCLE_OPTIONS = Object.keys(MUSCLE_GROUP) as MuscleGroup[];

const daySummary = (plan: DayPlan, routines: Routine[]): string => {
  if (plan.type === 'focus') {
    return plan.muscles.length > 0 ? plan.muscles.map((muscle) => MUSCLE_GROUP[muscle]).join('·') : '부위 선택';
  }
  if (plan.type === 'routine') {
    return routines.find((routine) => routine.id === plan.routineId)?.name ?? '루틴 선택';
  }
  return TYPE_LABEL[plan.type];
};

export function WeeklyPlanEditor({ weekPlan, routines, onChange }: WeeklyPlanEditorProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const selectedPlan = getDayPlan(weekPlan, selectedDay);

  const setType = (type: DayPlanType) => {
    if (type === 'routine') {
      onChange(selectedDay, { type, muscles: [], routineId: selectedPlan.routineId ?? routines[0]?.id });
      return;
    }
    onChange(selectedDay, { type, muscles: type === 'focus' ? selectedPlan.muscles : [] });
  };

  const setRoutine = (routineId: string) => onChange(selectedDay, { type: 'routine', muscles: [], routineId });

  const toggleMuscle = (muscle: MuscleGroup) => {
    const exists = selectedPlan.muscles.includes(muscle);
    const muscles = exists ? selectedPlan.muscles.filter((item) => item !== muscle) : [...selectedPlan.muscles, muscle];
    onChange(selectedDay, { type: 'focus', muscles });
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-7 gap-xs">
        {WEEKDAY_DISPLAY_ORDER.map((weekday) => {
          const plan = getDayPlan(weekPlan, weekday);
          const isSelected = weekday === selectedDay;
          const isActive = plan.type === 'focus' || plan.type === 'routine';
          const tone = isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : `border-card-border ${isActive ? 'bg-primary-subtle text-primary' : 'bg-glass text-muted-foreground'}`;
          return (
            <button
              key={weekday}
              type="button"
              onClick={() => setSelectedDay(weekday)}
              className={`flex aspect-square flex-col items-center justify-center rounded-md border text-sm font-medium ${tone}`}
            >
              {WEEKDAY_LABELS[weekday]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">{WEEKDAY_LABELS[selectedDay]}요일</span>
          <span className="text-sm text-muted-foreground">{daySummary(selectedPlan, routines)}</span>
        </div>

        <div className="flex gap-sm">
          {TYPE_OPTIONS.map((type) => {
            const isSelected = selectedPlan.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setType(type)}
                className={`h-11 flex-1 rounded-md text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-card-border bg-glass text-foreground hover:bg-primary-subtle'
                }`}
              >
                {TYPE_LABEL[type]}
              </button>
            );
          })}
        </div>

        {selectedPlan.type === 'focus' && (
          <div className="flex flex-col gap-sm">
            <span className="text-sm text-muted-foreground">운동할 부위 (여러 개 선택)</span>
            <div className="flex flex-wrap gap-sm">
              {MUSCLE_OPTIONS.map((muscle) => {
                const isOn = selectedPlan.muscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleMuscle(muscle)}
                    className={`rounded-full px-md py-xs text-sm font-medium transition-colors ${
                      isOn
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-card-border bg-glass text-foreground hover:bg-primary-subtle'
                    }`}
                  >
                    {MUSCLE_GROUP[muscle]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedPlan.type === 'routine' && (
          <div className="flex flex-col gap-sm">
            <span className="text-sm text-muted-foreground">이 요일에 할 루틴</span>
            {routines.length === 0 ? (
              <span className="rounded-lg border border-card-border bg-glass p-md text-sm text-muted-foreground">
                저장된 루틴이 없어요. 먼저 루틴을 만들어 주세요.
              </span>
            ) : (
              <div className="flex flex-col gap-sm">
                {routines.map((routine) => {
                  const isOn = selectedPlan.routineId === routine.id;
                  return (
                    <button
                      key={routine.id}
                      type="button"
                      onClick={() => setRoutine(routine.id)}
                      className={`rounded-md px-md py-sm text-left text-sm font-medium transition-colors ${
                        isOn
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-card-border bg-glass text-foreground hover:bg-primary-subtle'
                      }`}
                    >
                      {routine.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
