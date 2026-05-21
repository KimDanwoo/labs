'use client';

import { useRef } from 'react';
import Image from 'next/image';
import type { CharacterId, Poop as PoopType, CharacterPosition, RoomType } from '@shared/types';
import { DANGER_THRESHOLD } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { ROOM_BACKGROUNDS } from '../constants';

type RoomProps = {
  characterId: CharacterId;
  position: CharacterPosition;
  poops: PoopType[];
  level: number;
  isSleeping: boolean;
  isSick: boolean;
  isDead: boolean;
  hunger: number;
  cleanliness: number;
  onCleanPoop: (poopId: string) => void;
  nickname: string;
  roomType?: RoomType;
};

export default function Room({
  characterId,
  position,
  poops,
  level,
  isSleeping,
  isSick,
  isDead,
  hunger,
  cleanliness,
  onCleanPoop,
  nickname,
  roomType = 'living',
}: RoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const backgroundSrc = ROOM_BACKGROUNDS[roomType];
  const isDanger = hunger <= DANGER_THRESHOLD || cleanliness <= DANGER_THRESHOLD;

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
      <div
        className="absolute z-10"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CharacterSprite
          characterId={characterId}
          size={64}
          direction={position.direction}
          isMoving={position.isMoving}
          isSleeping={isSleeping}
          isSick={isSick}
          isDead={isDead}
          level={level}
        />
        {/* 이름 */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full surface text-gray-600 shadow-game-sm">
            {nickname}
          </span>
        </div>
      </div>

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
