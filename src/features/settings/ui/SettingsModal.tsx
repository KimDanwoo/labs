'use client';

import { useState } from 'react';
import { useAuth } from '@entities/auth';
import { useGameActions } from '@entities/game';

export default function SettingsModal() {
  const { isAnonymous, linkWithGoogle } = useAuth();
  const { reset, closeModal } = useGameActions();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    reset();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-overlay" onClick={closeModal} />
      <div className="relative w-full max-w-sm modal-content p-6 mx-4 space-y-6 animate-scale-in">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-700">설정</h3>
          <button onClick={closeModal} className="text-gray-400 text-xl btn-press">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="surface rounded-2xl p-4 space-y-3">
            <div>
              <div className="text-sm font-bold text-gray-700">계정</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {isAnonymous ? '게스트로 플레이 중' : '구글 계정 연동됨 ✓'}
              </div>
            </div>
            {isAnonymous && (
              <button
                onClick={linkWithGoogle}
                className="w-full py-3 rounded-xl font-bold text-sm btn-press bg-white border border-gray-200 text-gray-700 flex items-center justify-center gap-2 shadow-game-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                구글 계정 연동
              </button>
            )}
          </div>

          <div className="surface rounded-2xl p-4 space-y-3">
            <div>
              <div className="text-sm font-bold text-gray-700">게임 초기화</div>
              <div className="text-xs text-gray-400">캐릭터를 처음부터 다시 키워요</div>
              <div className="text-xs text-amber-500 mt-0.5">
                코인과 해금 캐릭터는 유지돼요
              </div>
            </div>
            <button
              onClick={handleReset}
              className={`w-full py-3 rounded-xl font-bold text-sm btn-press transition-colors ${
                confirmReset
                  ? 'bg-red-500 text-white'
                  : 'bg-red-50 text-red-400 border border-red-200'
              }`}
            >
              {confirmReset ? '정말 초기화할래요?' : '초기화'}
            </button>
          </div>

          <div className="surface rounded-2xl p-4">
            <div className="text-sm font-bold text-gray-700">PLAVE GOTCHI</div>
            <div className="text-xs text-gray-400 mt-1">v1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
