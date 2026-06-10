'use client';

import type { ReactNode } from 'react';
import MinigameCooldownNotice from './MinigameCooldownNotice';

type MinigameReadyScreenProps = {
  canPlay: boolean;
  cooldownRemainingMs: number;
  onStart: () => void | Promise<void>;
  onExitToMenu: () => void;
  accentColor: string;
  errorMessage?: string | null;
  extra?: ReactNode;
  children: ReactNode;
};

export default function MinigameReadyScreen({
  canPlay,
  cooldownRemainingMs,
  onStart,
  onExitToMenu,
  accentColor,
  errorMessage,
  extra,
  children,
}: MinigameReadyScreenProps) {
  return (
    <div className="space-y-4 py-3">
      {children}
      {extra}
      {!canPlay && <MinigameCooldownNotice remainingMs={cooldownRemainingMs} />}
      {errorMessage && (
        <p className="text-[11px] text-red-400">{errorMessage}</p>
      )}
      <button
        onClick={onStart}
        disabled={!canPlay}
        className="btn-primary btn-press w-full disabled:opacity-40"
        style={{ backgroundColor: accentColor }}
      >
        {canPlay ? '시작!' : '에너지 부족'}
      </button>
      <button
        onClick={onExitToMenu}
        className="w-full py-2 text-xs text-gray-400 btn-press"
      >
        다른 게임 고르기
      </button>
    </div>
  );
}
