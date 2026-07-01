'use client';

import { useState, useEffect } from 'react';
import { CharacterSprite } from '@shared/ui';
import type { CharacterId } from '@shared/types';
import SpeechBubble from './SpeechBubble';

const BUBBLE_DURATION_MS = 3000;

type SceneCharacterProps = {
  characterId: CharacterId;
  nickname: string;
  x: number;
  y: number;
  latestMessage: string | null;
  isMe?: boolean;
};

export default function SceneCharacter({
  characterId,
  nickname,
  x,
  y,
  latestMessage,
  isMe = false,
}: SceneCharacterProps) {
  return (
    <div
      className="absolute z-10 pointer-events-none flex flex-col items-center"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative">
        {latestMessage && (
          <BubbleTimer key={latestMessage} message={latestMessage} />
        )}
        <CharacterSprite characterId={characterId} size={isMe ? 64 : 52} />
      </div>
      <span
        className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-tight ${
          isMe
            ? 'bg-gold/80 text-white'
            : 'bg-white/70 text-gray-600 border border-card-border'
        }`}
      >
        {nickname}
      </span>
    </div>
  );
}

/**
 * 마운트 후 BUBBLE_DURATION_MS 뒤 자신을 숨기는 컴포넌트.
 * 부모가 key를 바꾸면 리마운트되어 타이머가 재시작된다.
 * useEffect에서 setState를 부르지만, 외부 타이머(setTimeout) 콜백 안에서 호출하므로
 * React의 "setState in effect body" 규칙을 위반하지 않는다.
 */
function BubbleTimer({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, BUBBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <SpeechBubble message={message} />;
}
