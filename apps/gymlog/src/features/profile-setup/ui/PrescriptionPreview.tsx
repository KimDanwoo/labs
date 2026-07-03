'use client';

import type { UserProfile } from '@entities/profile/model/types';
import { formatRestLabel, getPrescription } from '@shared/training';

type PrescriptionPreviewProps = {
  profile: Pick<UserProfile, 'goal' | 'defaultSets' | 'restSec'>;
};

// 선택(목표·난이도·세트·휴식)이 실제 운동을 어떻게 만드는지 즉시 보여준다.
export function PrescriptionPreview({ profile }: PrescriptionPreviewProps) {
  const plan = getPrescription(profile.goal, profile.defaultSets, profile.restSec);

  return (
    <div className="flex flex-col gap-sm rounded-lg border border-primary bg-primary-subtle p-lg">
      <span className="text-sm font-medium text-primary">이렇게 운동하게 돼요</span>
      <p className="text-base font-semibold text-foreground">
        운동당 {plan.sets}세트 × {plan.reps}회 · 휴식 {formatRestLabel(plan.restSec)}
      </p>
      <p className="text-sm text-muted-foreground">
        부위당 {plan.perMuscle}종목으로 구성돼요. 운동 중에 무게·횟수는 자유롭게 조정돼요.
      </p>
    </div>
  );
}
