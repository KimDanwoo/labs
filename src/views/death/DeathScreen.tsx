'use client';

import { useAtomValue } from 'jotai';
import { CharacterSprite } from '@shared/ui';
import { characterIdAtom, nicknameAtom, useGameActions } from '@entities/game';

export default function DeathScreen() {
  const characterId = useAtomValue(characterIdAtom);
  const nickname = useAtomValue(nicknameAtom);
  const { reset } = useGameActions();

  if (!characterId) return null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 gap-6 bg-gray-100">
      <div className="text-center space-y-4">
        <div className="death-animation">
          <CharacterSprite characterId={characterId} size={80} isDead />
        </div>
        <h2 className="text-xl font-bold text-gray-600">
          {nickname}(이)가 떠났어요...
        </h2>
        <p className="text-sm text-gray-400">밥을 잘 챙겨주고 청소도 해줘야 해요</p>
      </div>

      <button
        onClick={reset}
        className="px-8 py-3 rounded-xl bg-gray-700 text-white font-bold btn-press"
      >
        다시 시작하기
      </button>
    </div>
  );
}
