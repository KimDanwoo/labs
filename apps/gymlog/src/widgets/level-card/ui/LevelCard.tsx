'use client';

import { computeProficiency } from '@entities/session/model/lib';
import { sessionHistoryAtom } from '@entities/session/model/store';
import { formatVolume } from '@shared/lib';
import { useAtom } from 'jotai';
import { LevelAvatar } from './LevelAvatar';

// 누적 볼륨(무게×횟수)으로 캐릭터 레벨을 보여주는 동기부여 카드.
export function LevelCard() {
  const [history] = useAtom(sessionHistoryAtom);
  const proficiency = computeProficiency(history);
  const percent = Math.round(proficiency.progress * 100);

  return (
    <section className="flex items-center gap-md rounded-lg border border-card-border bg-glass p-lg">
      <LevelAvatar level={proficiency.level} />
      <div className="flex flex-1 flex-col gap-xs">
        <div className="flex items-baseline justify-between gap-sm">
          <span className="font-display text-lg font-bold text-foreground">
            Lv.{proficiency.level} {proficiency.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {proficiency.isMax ? '최고 레벨' : `${formatVolume(proficiency.toNext ?? 0)} 남음`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-subtle">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {proficiency.isMax
            ? `머슬킹 달성! 👑 누적 ${formatVolume(proficiency.totalVolume)}`
            : `누적 ${formatVolume(proficiency.totalVolume)} · 무게를 늘릴수록 빨리 자라요`}
        </span>
      </div>
    </section>
  );
}
