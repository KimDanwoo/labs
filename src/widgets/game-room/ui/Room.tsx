'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { CharacterId, Poop as PoopType, CharacterPosition, RoomType } from '@shared/types';
import { DANGER_THRESHOLD } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { ROOM_BACKGROUNDS } from '../constants';

const JUMP_DURATION_MS = 450;
const HEART_FLOAT_DURATION_MS = 1000;

type RoomProps = {
  characterId: CharacterId;
  position: CharacterPosition;
  poops: PoopType[];
  level: number;
  isSleeping: boolean;
  isDrowsy: boolean;
  isSick: boolean;
  isDead: boolean;
  hunger: number;
  cleanliness: number;
  onCleanPoop: (poopId: string) => void;
  onWakeUp: () => void;
  roomType?: RoomType;
};

export default function Room({
  characterId,
  position,
  poops,
  level,
  isSleeping,
  isDrowsy,
  isSick,
  isDead,
  hunger,
  cleanliness,
  onCleanPoop,
  onWakeUp,
  roomType = 'living',
}: RoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const backgroundSrc = ROOM_BACKGROUNDS[roomType];
  const isDanger = hunger <= DANGER_THRESHOLD || cleanliness <= DANGER_THRESHOLD;

  const [isJumping, setIsJumping] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const heartIdRef = useRef(0);

  const handleCharacterClick = () => {
    if (isDead) return;
    if (isSleeping || isDrowsy) {
      onWakeUp();
      return;
    }
    if (!isJumping) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), JUMP_DURATION_MS);
    }
    const id = heartIdRef.current++;
    setFloatingHearts((prev) => [...prev, id]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h !== id));
    }, HEART_FLOAT_DURATION_MS);
  };

  return (
    <div
      ref={roomRef}
      className={`relative flex-1 rounded-2xl sm:rounded-3xl overflow-hidden shadow-game-lg ${
        isDanger ? 'ring-2 ring-red-400/60 animate-pulse' : ''
      }`}
      style={{ minHeight: '40dvh' }}
    >
      <Image
        src={backgroundSrc}
        alt="방 배경"
        fill
        className="object-cover transition-opacity duration-500"
        priority
      />

      {/* 똥 */}
      {poops.map((poop) => (
        <button
          key={poop.id}
          onClick={() => onCleanPoop(poop.id)}
          className="absolute poop-appear cursor-pointer text-2xl hover:scale-125 transition-transform z-10 drop-shadow-sm"
          style={{
            left: `${poop.x}%`,
            top: `${poop.y}%`,
          }}
        >
          💩
        </button>
      ))}

      {/* 캐릭터 */}
      <button
        type="button"
        onClick={handleCharacterClick}
        disabled={isDead}
        className="absolute z-10 cursor-pointer focus:outline-none"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className={`relative ${isJumping ? 'character-jump' : ''}`}>
          <CharacterSprite
            characterId={characterId}
            size={64}
            direction={position.direction}
            isMoving={position.isMoving}
            isSleeping={isSleeping}
            isDrowsy={isDrowsy}
            isSick={isSick}
            isDead={isDead}
            level={level}
          />
          {floatingHearts.map((id) => (
            <span
              key={id}
              className="absolute left-1/2 -translate-x-1/2 -top-1 text-xl heart-effect pointer-events-none"
            >
              💕
            </span>
          ))}
        </div>
      </button>

      {/* 수면 오버레이 */}
      {isSleeping && (
        <div className="absolute inset-0 bg-indigo-950/20 z-20 pointer-events-none" />
      )}

      {/* 질병 오버레이 */}
      {isSick && !isSleeping && (
        <div className="absolute inset-0 bg-green-900/10 z-20 pointer-events-none" />
      )}
    </div>
  );
}
