'use client';

import { useState, useEffect } from 'react';
import type { CharacterId } from '@shared/types';
import { CharacterSprite } from '@shared/ui';
import {
  MEETING_CHARACTERS,
  MEETING_RANDOM_NAMES,
  MEETING_MATCHING_MS,
  MEETING_FOUND_MS,
} from '../constants';

type MeetingModalProps = {
  myCharacterId: CharacterId;
  onComplete: () => void;
  onClose: () => void;
};

export default function MeetingModal({ myCharacterId, onComplete, onClose }: MeetingModalProps) {
  const [phase, setPhase] = useState<'searching' | 'found' | 'greeting'>('searching');
  const [metCharacter, setMetCharacter] = useState<CharacterId | null>(null);
  const [metName, setMetName] = useState('');

  useEffect(() => {
    // 매칭 시뮬레이션: 랜덤 캐릭터 만남
    const candidates = MEETING_CHARACTERS.filter((c) => c !== myCharacterId);
    const timer = setTimeout(() => {
      const randomChar = candidates[Math.floor(Math.random() * candidates.length)];
      const randomName = MEETING_RANDOM_NAMES[Math.floor(Math.random() * MEETING_RANDOM_NAMES.length)];
      setMetCharacter(randomChar);
      setMetName(randomName);
      setPhase('found');
    }, MEETING_MATCHING_MS);

    return () => clearTimeout(timer);
  }, [myCharacterId]);

  useEffect(() => {
    if (phase !== 'found') return;

    const timer = setTimeout(() => setPhase('greeting'), MEETING_FOUND_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-overlay" onClick={phase === 'greeting' ? handleComplete : undefined} />
      <div className="relative w-full max-w-sm modal-content p-8 mx-4 text-center space-y-6 animate-scale-in">
        {phase === 'searching' && (
          <>
            <h3 className="text-lg font-bold text-gray-700">만남의 방</h3>
            <div className="text-4xl animate-bounce">💌</div>
            <p className="text-gray-500">친구를 찾고 있어요...</p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-pink-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </>
        )}

        {phase === 'found' && metCharacter && (
          <>
            <h3 className="text-lg font-bold text-pink-500">친구를 만났어요!</h3>
            <div className="flex justify-center items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <CharacterSprite characterId={myCharacterId} size={56} />
                <span className="text-xs font-bold text-gray-500">나</span>
              </div>
              <div className="text-2xl heart-effect">💕</div>
              <div className="flex flex-col items-center gap-1">
                <CharacterSprite characterId={metCharacter} size={56} />
                <span className="text-xs font-bold text-gray-500">{metName}</span>
              </div>
            </div>
          </>
        )}

        {phase === 'greeting' && metCharacter && (
          <>
            <h3 className="text-lg font-bold text-pink-500">하트 +10!</h3>
            <div className="flex justify-center items-center gap-6">
              <CharacterSprite characterId={myCharacterId} size={56} />
              <div className="text-3xl">💕</div>
              <CharacterSprite characterId={metCharacter} size={56} />
            </div>
            <p className="text-sm text-gray-500">{metName}(와)과 즐거운 시간을 보냈어요!</p>
            <button
              onClick={handleComplete}
              className="px-8 py-3 rounded-xl bg-pink-400 text-white font-bold btn-press"
            >
              돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
