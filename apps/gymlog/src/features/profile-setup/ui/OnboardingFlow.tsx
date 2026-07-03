'use client';

import {
  buildWeeklyPlanForSplit,
  DEFAULT_PROFILE,
  DEFAULT_SETS,
  SET_COUNT_MAX,
  SET_COUNT_MIN,
  type UserProfile,
} from '@entities/profile/model/types';
import { GOAL, SELECTABLE_SPLITS, SPLIT, type Goal, type Split } from '@shared/training';
import { Button } from '@ui/react';
import { useState } from 'react';
import { NumberStepper } from './NumberStepper';
import { OptionList } from './OptionList';
import { PrescriptionPreview } from './PrescriptionPreview';

type OnboardingFlowProps = {
  onComplete: (profile: UserProfile) => void;
  // 기존 회원이 로그인으로 바로 가기(상위에서 auth 호출 — FSD 레이어 경계).
  // 이미 로그인된 경우 상위가 넘기지 않아 로그인 버튼이 숨는다.
  onSignIn?: () => void;
};

const STEPS = ['welcome', 'goal', 'split', 'sets', 'rest'] as const;
type Step = (typeof STEPS)[number];

const QUESTION_TOTAL = STEPS.length - 1;

const GOAL_OPTIONS = Object.keys(GOAL) as Goal[];

const GOAL_HINT: Record<Goal, string> = {
  strength: '무겁게, 적은 횟수로 힘을 키워요',
  hypertrophy: '적당한 무게로 근육 크기를 키워요',
  endurance: '가볍게, 많은 횟수로 버티는 힘을',
  power: '가볍고 빠르게, 폭발적으로',
};

const SPLIT_HINT: Partial<Record<Split, string>> = {
  fullBody: '한 번에 전신을 — 주 2~3회, 입문에 추천',
  upperLower: '가슴·삼두 / 등·이두 / 하체로 — 주 4회',
  ppl: '밀기·당기기·하체 — 주 3~6회',
  broSplit: '부위별로 하루 하나 — 주 5회',
  custom: '요일별·부위별로 내 맘대로 짤래요',
};

const REST_OPTIONS = [30, 45, 60, 90, 120, 180] as const;
const REST_HINT: Record<number, string> = {
  30: '숨만 고르고 바로',
  45: '살짝 여유 있게',
  60: '가장 무난해요',
  90: '무거운 운동에',
  120: '고중량·근력 위주',
  180: '최대 근력 훈련',
};

const formatRest = (seconds: number): string => (seconds >= 60 ? `${seconds / 60}분` : `${seconds}초`);

// 온보딩 중 선택값 — 기본 선택 없음(세트 수만 스테퍼라 시작값 필요).
type OnboardingDraft = {
  goal?: Goal;
  split?: Split;
  defaultSets: number;
  restSec?: number;
};

export function OnboardingFlow({ onComplete, onSignIn }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>({ defaultSets: DEFAULT_SETS });

  const step: Step = STEPS[stepIndex] ?? 'welcome';

  const patch = (next: Partial<OnboardingDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const advance = () => setStepIndex((index) => index + 1);
  const goPrev = () => setStepIndex((index) => Math.max(0, index - 1));
  // 미선택 항목은 안전한 기본값으로 보정해 완성된 프로필을 만든다(흐름상 보통 다 선택됨).
  const finish = (restSec: number) => {
    const split = draft.split ?? DEFAULT_PROFILE.split;
    onComplete({
      goal: draft.goal ?? DEFAULT_PROFILE.goal,
      split,
      defaultSets: draft.defaultSets,
      restSec,
      weekPlan: buildWeeklyPlanForSplit(split),
      onboarded: true,
    });
  };

  // 세트 단계 미리보기용 — 그 시점엔 목표가 이미 선택돼 있음(휴식은 아직이라 기본 보정).
  const previewProfile: Pick<UserProfile, 'goal' | 'defaultSets' | 'restSec'> = {
    goal: draft.goal ?? DEFAULT_PROFILE.goal,
    defaultSets: draft.defaultSets,
    restSec: draft.restSec ?? DEFAULT_PROFILE.restSec,
  };

  // 선택형 단계는 탭하면 바로 다음으로. 버튼은 환영·세트 단계에만.
  const showCta = step === 'welcome' || step === 'sets';

  return (
    <div className="flex min-h-dvh flex-col gap-3xl py-3xl">
      {step !== 'welcome' && (
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={goPrev}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ←
            </button>
            <span className="text-sm text-muted-foreground">
              {stepIndex} / {QUESTION_TOTAL}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-primary-subtle">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(stepIndex / QUESTION_TOTAL) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div key={step} className="fade-up flex flex-1 flex-col gap-xl">
        {step === 'welcome' && (
          <div className="flex flex-1 flex-col justify-center gap-md">
            <p className="text-4xl font-bold text-foreground">안녕하세요 👋</p>
            <p className="text-base text-muted-foreground">
              gymlog를 쓰기 전에 몇 가지만 여쭤볼게요. 운동을 어떻게 추천하고 기록할지 맞춰드릴게요. 1분이면 끝나고,
              나중에 설정에서 언제든 바꿀 수 있어요.
            </p>
            {onSignIn && (
              <button
                type="button"
                onClick={onSignIn}
                className="mt-sm self-start text-sm font-medium text-primary hover:underline"
              >
                이미 계정이 있으신가요? 로그인
              </button>
            )}
          </div>
        )}

        {step === 'goal' && (
          <>
            <h1 className="text-2xl font-bold text-foreground">어떤 목표로 운동하세요?</h1>
            <OptionList
              options={GOAL_OPTIONS}
              value={draft.goal ?? null}
              getLabel={(goal) => GOAL[goal]}
              getHint={(goal) => GOAL_HINT[goal]}
              onSelect={(goal) => {
                patch({ goal });
                advance();
              }}
            />
          </>
        )}

        {step === 'split' && (
          <>
            <h1 className="text-2xl font-bold text-foreground">운동을 어떻게 나눠서 하세요?</h1>
            <p className="text-sm text-muted-foreground">분할 방식이에요. 잘 모르겠으면 무분할이 가장 무난해요.</p>
            <OptionList
              options={SELECTABLE_SPLITS}
              value={draft.split ?? null}
              getLabel={(split) => SPLIT[split]}
              getHint={(split) => SPLIT_HINT[split]}
              onSelect={(split) => {
                patch({ split });
                advance();
              }}
            />
          </>
        )}

        {step === 'sets' && (
          <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
              <h1 className="text-2xl font-bold text-foreground">한 종목에 몇 세트 하세요?</h1>
              <p className="text-sm text-muted-foreground">보통 3~4세트가 무난해요. 운동마다 다시 조절할 수 있어요.</p>
            </div>
            <NumberStepper
              value={draft.defaultSets}
              min={SET_COUNT_MIN}
              max={SET_COUNT_MAX}
              suffix="세트"
              onChange={(defaultSets) => patch({ defaultSets })}
            />
            <PrescriptionPreview profile={previewProfile} />
          </div>
        )}

        {step === 'rest' && (
          <>
            <h1 className="text-2xl font-bold text-foreground">세트 사이 휴식은요?</h1>
            <OptionList
              options={REST_OPTIONS}
              value={draft.restSec ?? null}
              getLabel={formatRest}
              getHint={(seconds) => REST_HINT[seconds]}
              onSelect={(restSec) => finish(restSec)}
            />
          </>
        )}
      </div>

      {showCta && (
        <Button className="h-14 w-full text-base font-semibold" onClick={advance}>
          {step === 'welcome' ? '시작하기' : '다음'}
        </Button>
      )}
    </div>
  );
}
