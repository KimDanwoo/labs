'use client';

import { useState, useEffect } from 'react';
import type { CharacterId } from '@shared/types';
import { SPRITE_MAP, FRAME_SIZE, SHEET_SIZE, WALK_FPS, TOTAL_FRAMES, LEVEL_SCALE_PER_LEVEL } from '@shared/constants';

type SpriteDirection = 'up' | 'down' | 'left' | 'right';

type CharacterSpriteProps = {
  characterId: CharacterId;
  size?: number;
  direction?: SpriteDirection;
  isMoving?: boolean;
  isSleeping?: boolean;
  isDrowsy?: boolean;
  isSick?: boolean;
  isDead?: boolean;
  level?: number;
};

const DIRECTION_ROW: Record<SpriteDirection, number> = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
};

export default function CharacterSprite({
  characterId,
  size = 64,
  direction = 'right',
  isMoving = false,
  isSleeping = false,
  isDrowsy = false,
  isSick = false,
  isDead = false,
  level = 1,
}: CharacterSpriteProps) {
  const [frame, setFrame] = useState(0);
  const isWalking = isMoving && !isSleeping && !isDead;

  useEffect(() => {
    if (!isWalking) return;
    const id = setInterval(() => {
      setFrame((prev) => (prev + 1) % TOTAL_FRAMES);
    }, 1000 / WALK_FPS);
    return () => clearInterval(id);
  }, [isWalking]);

  const scale = 1 + (level - 1) * LEVEL_SCALE_PER_LEVEL;
  const actualSize = size * scale;

  // idle일 때는 앞모습(row 1), 이동 중에는 direction에 해당하는 row 사용
  const row = isMoving ? DIRECTION_ROW[direction] : 1;
  const col = isWalking ? frame : 0;

  const bgX = -(col * FRAME_SIZE);
  const bgY = -(row * FRAME_SIZE);

  const wrapperClass = isDead
    ? 'death-animation'
    : isSleeping
      ? 'idle'
      : '';

  return (
    <div className={`relative ${wrapperClass}`} style={{ width: actualSize, height: actualSize }}>
      <div
        className="pixel-art"
        style={{
          width: actualSize,
          height: actualSize,
          backgroundImage: `url(${SPRITE_MAP[characterId]})`,
          backgroundSize: `${(SHEET_SIZE / FRAME_SIZE) * actualSize}px ${(SHEET_SIZE / FRAME_SIZE) * actualSize}px`,
          backgroundPosition: `${(bgX / FRAME_SIZE) * actualSize}px ${(bgY / FRAME_SIZE) * actualSize}px`,
          backgroundRepeat: 'no-repeat',
          opacity: isDead ? 0.5 : 1,
          filter: isSleeping ? 'brightness(0.7)' : isDrowsy ? 'brightness(0.88)' : undefined,
        }}
      />

      {/* 수면/졸림 표시 */}
      {isSleeping && (
        <div className="absolute -top-2 -right-2 text-sm font-bold text-blue-300">
          <span className="sleep-z inline-block">Z</span>
          <span className="sleep-z inline-block" style={{ animationDelay: '0.5s' }}>z</span>
          <span className="sleep-z inline-block" style={{ animationDelay: '1s' }}>z</span>
        </div>
      )}
      {isDrowsy && !isSleeping && (
        <div className="absolute -top-2 -right-1 text-xs font-bold text-blue-300/80">
          <span className="sleep-z inline-block">z</span>
        </div>
      )}

      {/* 질병 표시 */}
      {isSick && !isSleeping && !isDead && (
        <div className="absolute -top-3 -left-1 text-lg animate-pulse">💀</div>
      )}
    </div>
  );
}
