'use client';

import { useState } from 'react';
import { useGameActions } from '@entities/game';
import CatchGame from './CatchGame';
import QuizGame from './QuizGame';

type Mode = 'select' | 'catch' | 'quiz';

export default function MiniGameModal() {
  const { closeModal } = useGameActions();
  const [mode, setMode] = useState<Mode>('select');
  const exitToMenu = () => setMode('select');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-overlay" />
      <div className="relative w-full max-w-sm modal-content p-5 mx-4 text-center space-y-4 animate-scale-in">
        <button
          onClick={closeModal}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-game-md text-base leading-none transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>

        {mode === 'select' && (
          <div className="space-y-4 py-3">
            <h3 className="text-lg font-bold text-gray-700">놀기</h3>
            <p className="text-xs text-gray-400">어떤 게임을 해볼까?</p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setMode('catch')}
                className="rounded-2xl p-4 text-left bg-linear-to-br from-pink-50 to-rose-50 border border-pink-200 btn-press shadow-game-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💖</span>
                  <div>
                    <div className="text-sm font-bold text-pink-600">하트 캐치</div>
                    <div className="text-[11px] text-gray-500">
                      떨어지는 하트를 받아요
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('quiz')}
                className="rounded-2xl p-4 text-left bg-linear-to-br from-violet-50 to-purple-50 border border-violet-200 btn-press shadow-game-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💡</span>
                  <div>
                    <div className="text-sm font-bold text-violet-600">
                      PLAVE 취향 퀴즈
                    </div>
                    <div className="text-[11px] text-gray-500">
                      멤버 취향 3문제 맞히기
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === 'catch' && <CatchGame onExitToMenu={exitToMenu} />}
        {mode === 'quiz' && <QuizGame onExitToMenu={exitToMenu} />}
      </div>
    </div>
  );
}
