'use client';

import { REST_SEC_OPTIONS, SET_COUNT_MAX, SET_COUNT_MIN, type UserProfile } from '@entities/profile/model/types';
import { GOAL, SELECTABLE_SPLITS, SPLIT, type Goal } from '@shared/training';
import { NumberStepper } from './NumberStepper';
import { PillGroup } from './PillGroup';
import { RangeField } from './RangeField';

type ProfileFormProps = {
  value: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  showRest?: boolean;
};

const GOAL_OPTIONS = Object.keys(GOAL) as Goal[];

const formatRest = (seconds: number): string => (seconds >= 60 ? `${seconds / 60}분` : `${seconds}초`);

export function ProfileForm({ value, onChange, showRest = false }: ProfileFormProps) {
  return (
    <div className="flex flex-col gap-xl">
      <PillGroup
        label="목표"
        options={GOAL_OPTIONS}
        value={value.goal}
        getLabel={(goal) => GOAL[goal]}
        onSelect={(goal) => onChange({ goal })}
      />
      <PillGroup
        label="분할"
        options={SELECTABLE_SPLITS}
        value={value.split}
        getLabel={(split) => SPLIT[split]}
        onSelect={(split) => onChange({ split })}
      />
      <div className="flex flex-col gap-sm">
        <span className="text-sm font-medium text-muted">기본 세트 수</span>
        <NumberStepper
          value={value.defaultSets}
          min={SET_COUNT_MIN}
          max={SET_COUNT_MAX}
          suffix="세트"
          onChange={(defaultSets) => onChange({ defaultSets })}
        />
      </div>
      {showRest && (
        <RangeField
          label="휴식 시간"
          options={REST_SEC_OPTIONS}
          value={value.restSec}
          getLabel={formatRest}
          onSelect={(restSec) => onChange({ restSec })}
        />
      )}
    </div>
  );
}
