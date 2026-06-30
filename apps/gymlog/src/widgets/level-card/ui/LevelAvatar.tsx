'use client';

import { useState } from 'react';

import { LEVEL_SPRITE_SRC } from '@entities/session/model/constants';

type LevelAvatarProps = {
  level: number;
};

// 12개 캐릭터가 한 장(4열×3행 그리드)에 담긴 스프라이트. public/levels/characters.png 에 저장.
const SPRITE_SRC = LEVEL_SPRITE_SRC;
const COLS = 4;
const ROWS = 3;

// 레벨(1~12) → 그리드 칸 위치를 background-position 퍼센트로 변환.
const cellPosition = (level: number): string => {
  const index = Math.min(COLS * ROWS - 1, Math.max(0, level - 1));
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
};

export function LevelAvatar({ level }: LevelAvatarProps) {
  const [ready, setReady] = useState(false);

  return (
    <div
      role="img"
      aria-label={`레벨 ${level} 캐릭터`}
      className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-subtle"
    >
      {!ready && <span className="font-display text-2xl font-bold text-primary">{level}</span>}
      <span
        aria-hidden
        className="absolute inset-0 bg-no-repeat transition-opacity duration-300"
        style={{
          backgroundImage: `url('${SPRITE_SRC}')`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          backgroundPosition: cellPosition(level),
          opacity: ready ? 1 : 0,
        }}
      />
      {/* 스프라이트 로드 감지용 프로브(숨김). 없으면 숫자 폴백이 유지됨. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SPRITE_SRC} alt="" className="hidden" onLoad={() => setReady(true)} />
    </div>
  );
}
