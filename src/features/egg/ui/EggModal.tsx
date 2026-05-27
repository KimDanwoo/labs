'use client';

import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { CHARACTERS } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import {
  eggReadyCharacterIdAtom,
  isAllUnlockedAtom,
  useGameActions,
} from '@entities/game';
import { EGG_DISPLAY_MS, EGG_HATCHING_MS } from '../model';
import type { EggPhase } from '../model';

export default function EggModal() {
  const characterId = useAtomValue(eggReadyCharacterIdAtom);
  const isAllUnlocked = useAtomValue(isAllUnlockedAtom);
  const { collectEgg, closeModal } = useGameActions();

  const [phase, setPhase] = useState<EggPhase>('egg');

  useEffect(() => {
    if (phase === 'egg') {
      const timer = setTimeout(() => setPhase('hatching'), EGG_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
    if (phase === 'hatching') {
      const timer = setTimeout(() => setPhase('reveal'), EGG_HATCHING_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (!characterId) return null;
  const character = CHARACTERS[characterId];

  const handleCollect = () => {
    collectEgg();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-overlay" />
      <div className="relative w-full max-w-sm modal-content p-8 mx-4 text-center space-y-6 animate-scale-in">
        {phase === 'egg' && (
          <>
            <h3 className="text-lg font-bold text-pink-500">알을 발견했어요!</h3>
            <div className="text-7xl animate-bounce">🥚</div>
            <p className="text-sm text-gray-500">두근두근... 뭐가 나올까?</p>
          </>
        )}

        {phase === 'hatching' && (
          <>
            <h3 className="text-lg font-bold text-pink-500">부화 중...</h3>
            <div className="text-7xl egg-shake">🥚</div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-pink-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {phase === 'reveal' && (
          <>
            <h3 className="text-lg font-bold" style={{ color: character.color }}>
              {isAllUnlocked ? '보너스 코인!' : `${character.name} 해금!`}
            </h3>
            <div className="flex justify-center">
              <CharacterSprite characterId={characterId} size={80} />
            </div>
            {isAllUnlocked ? (
              <p className="text-sm text-yellow-500 font-bold">
                이미 모두 해금! 🪙 +100 코인
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {character.emoji} {character.name}을(를) 키울 수 있게 되었어요!
              </p>
            )}
            <button
              onClick={handleCollect}
              className="px-8 py-3 rounded-xl text-white font-bold btn-press"
              style={{ backgroundColor: character.color }}
            >
              받기!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
