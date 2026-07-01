'use client';

import { useState } from 'react';
import { MODAL_TYPE } from '@shared/constants';
import { ModalShell } from '@shared/ui';
import { useGameActions } from '@entities/game/model/hooks';
import { MINIGAME_MODE } from '../model/constants';
import type { MinigameMode } from '../model/types';
import CatchGame from './CatchGame';
import PlcoRunGame from './PlcoRunGame';
import QuizGame from './QuizGame';

export default function MiniGameModal() {
  const { closeModal, openModal } = useGameActions();
  const [mode, setMode] = useState<MinigameMode>(MINIGAME_MODE.SELECT);
  const exitToMenu = () => setMode(MINIGAME_MODE.SELECT);

  return (
    <ModalShell
      onClose={closeModal}
      disableBackdropClose={mode !== MINIGAME_MODE.SELECT}
      className="p-5 text-center space-y-4"
    >
      {(close) => (
        <>
          <button
            onClick={close}
            className="absolute -top-3 -right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-game-md text-base leading-none transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>

          {mode === MINIGAME_MODE.SELECT && (
            <div className="space-y-4 py-3">
              <h3 className="text-lg font-bold text-gray-700">놀기</h3>
              <p className="text-xs text-gray-400">어떤 게임을 해볼까?</p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setMode(MINIGAME_MODE.CATCH)}
                  className="rounded-2xl p-4 text-left bg-linear-to-br from-pink-50 to-rose-50 border border-pink-200 btn-press shadow-game-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💖</span>
                    <div>
                      <div className="text-sm font-bold text-pink-600">
                        하트 캐치
                      </div>
                      <div className="text-[11px] text-gray-500">
                        떨어지는 하트를 받아요
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode(MINIGAME_MODE.RUN)}
                  className="rounded-2xl p-4 text-left bg-linear-to-br from-emerald-50 to-green-50 border border-emerald-200 btn-press shadow-game-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏃</span>
                    <div>
                      <div className="text-sm font-bold text-emerald-600">
                        플코런
                      </div>
                      <div className="text-[11px] text-gray-500">
                        탭으로 점프해서 기록을 세워요
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode(MINIGAME_MODE.QUIZ)}
                  className="rounded-2xl p-4 text-left bg-linear-to-br from-violet-50 to-purple-50 border border-violet-200 btn-press shadow-game-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💡</span>
                    <div>
                      <div className="text-sm font-bold text-violet-600">
                        PLCO 취향 퀴즈
                      </div>
                      <div className="text-[11px] text-gray-500">
                        멤버 취향 3문제 맞히기
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => openModal(MODAL_TYPE.ROOMS)}
                  className="rounded-2xl p-4 text-left bg-linear-to-br from-sky-50 to-blue-50 border border-sky-200 btn-press shadow-game-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💬</span>
                    <div>
                      <div className="text-sm font-bold text-sky-600">
                        팬 톡
                      </div>
                      <div className="text-[11px] text-gray-500">
                        다른 팬들과 수다 떨기
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {mode === MINIGAME_MODE.CATCH && (
            <CatchGame onExitToMenu={exitToMenu} />
          )}
          {mode === MINIGAME_MODE.RUN && (
            <PlcoRunGame onExitToMenu={exitToMenu} />
          )}
          {mode === MINIGAME_MODE.QUIZ && <QuizGame onExitToMenu={exitToMenu} />}
        </>
      )}
    </ModalShell>
  );
}
