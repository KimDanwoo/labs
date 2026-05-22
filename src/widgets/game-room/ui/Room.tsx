'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import type { CharacterId, Poop as PoopType, CharacterPosition, RoomType } from '@shared/types';
import { DANGER_THRESHOLD } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { ROOM_BACKGROUNDS } from '../constants';

const TAP_REACTION_MS = 900;

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
  onMoveTo?: (xPercent: number, yPercent: number) => void;
  roomType?: RoomType;
};

type TapReaction = { id: number };

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
  onMoveTo,
  roomType = 'living',
}: RoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const tapIdRef = useRef(0);
  const [reactions, setReactions] = useState<TapReaction[]>([]);

  const backgroundSrc = ROOM_BACKGROUNDS[roomType];
  const isDanger = hunger <= DANGER_THRESHOLD || cleanliness <= DANGER_THRESHOLD;
  const canInteract = !isSleeping && !isDead;

  const handleRoomClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract || !onMoveTo) return;
    if (!roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    onMoveTo(xPct, yPct);
  }, [canInteract, onMoveTo]);

  const handleCharacterTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canInteract) return;
    const id = ++tapIdRef.current;
    setReactions((prev) => [...prev, { id }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, TAP_REACTION_MS);
  }, [canInteract]);

  const latestReactionId = reactions.length > 0 ? reactions[reactions.length - 1].id : null;

  return (
    <div
      ref={roomRef}
      onClick={handleRoomClick}
      className={`relative flex-1 rounded-2xl sm:rounded-3xl overflow-hidden shadow-game-lg ${
        isDanger ? 'ring-2 ring-red-400/60 animate-pulse' : ''
      } ${canInteract && onMoveTo ? 'cursor-pointer' : ''}`}
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
          onClick={(e) => {
            e.stopPropagation();
            onCleanPoop(poop.id);
          }}
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
        <button
          type="button"
          onClick={handleCharacterTap}
          className="relative bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
          aria-label="캐릭터와 상호작용"
        >
          <div key={latestReactionId ?? 'idle'} className={latestReactionId ? 'tap-jump' : ''}>
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
          </div>

          {reactions.map((reaction) => (
            <span
              key={reaction.id}
              className="heart-pop-up pointer-events-none absolute left-1/2 bottom-full text-2xl"
            >
              💖
            </span>
          ))}
        </button>
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
