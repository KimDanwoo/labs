'use client';

import { levelUpAtom } from '@entities/session/model/store';
import { Button } from '@ui/react';
import { useAtom } from 'jotai';
import { LevelAvatar } from './LevelAvatar';

// 세션 저장 시 레벨이 오르면 뜨는 축하 오버레이.
export function LevelUpCelebration() {
  const [levelUp, setLevelUp] = useAtom(levelUpAtom);

  if (!levelUp) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-lg backdrop-blur-sm">
      <div className="pop flex w-full max-w-content flex-col items-center gap-lg rounded-xl border border-primary bg-glass p-3xl text-center">
        <span className="text-sm font-medium uppercase tracking-widest text-primary">Level Up</span>
        <div className="relative">
          <LevelAvatar level={levelUp.level} />
          <span className="absolute -top-2 -right-2 text-lg">✨</span>
          <span className="absolute -bottom-1 -left-2 text-base">✨</span>
        </div>
        <div className="flex flex-col gap-xs">
          <p className="font-display text-3xl font-bold text-foreground">Lv.{levelUp.level}</p>
          <p className="text-lg font-semibold text-foreground">{levelUp.name} 달성!</p>
          <p className="text-sm text-muted">꾸준함이 캐릭터를 키웠어요 💪</p>
        </div>
        <Button className="h-12 w-full" onClick={() => setLevelUp(null)}>
          좋아요
        </Button>
      </div>
    </div>
  );
}
