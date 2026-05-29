'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useAtomValue } from 'jotai';
import { CharacterSprite } from '@shared/ui';
import {
  characterIdAtom,
  characterPositionAtom,
  poopsAtom,
  levelAtom,
  isSleepingAtom,
  isDrowsyAtom,
  isSickAtom,
  isDangerAtom,
  roomTypeAtom,
} from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import { ROOM_BACKGROUNDS } from '../constants';

const JUMP_DURATION_MS = 450;
const HEART_FLOAT_DURATION_MS = 1000;

export default function Room() {
  const characterId = useAtomValue(characterIdAtom);
  const position = useAtomValue(characterPositionAtom);
  const poops = useAtomValue(poopsAtom);
  const level = useAtomValue(levelAtom);
  const isSleeping = useAtomValue(isSleepingAtom);
  const isDrowsy = useAtomValue(isDrowsyAtom);
  const isSick = useAtomValue(isSickAtom);
  const isDanger = useAtomValue(isDangerAtom);
  const roomType = useAtomValue(roomTypeAtom);
  const { cleanPoop, wakeUp } = useGameActions();

  const roomRef = useRef<HTMLDivElement>(null);
  const backgroundSrc = ROOM_BACKGROUNDS[roomType];

  const [isJumping, setIsJumping] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const heartIdRef = useRef(0);

  if (!characterId) return null;

  const handleCharacterClick = () => {
    if (isSleeping || isDrowsy) {
      wakeUp();
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

      {poops.map((poop) => (
        <button
          key={poop.id}
          onClick={() => cleanPoop(poop.id)}
          aria-label="똥 치우기"
          className="absolute poop-appear cursor-pointer text-sm blur-[3px] hover:blur-none hover:scale-125 transition-all duration-200 z-10 drop-shadow-sm"
          style={{ left: `${poop.x}%`, top: `${poop.y}%` }}
        >
          💩
        </button>
      ))}

      <button
        type="button"
        onClick={handleCharacterClick}
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
            isDead={false}
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

      {isSleeping && (
        <div className="absolute inset-0 bg-indigo-950/20 z-20 pointer-events-none" />
      )}

      {isSick && !isSleeping && (
        <div className="absolute inset-0 bg-green-900/10 z-20 pointer-events-none" />
      )}
    </div>
  );
}
