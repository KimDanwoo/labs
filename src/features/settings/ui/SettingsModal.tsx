'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuth,
  useIsAdmin,
  useGoogleConsent,
} from '@entities/auth/model/hooks';
import { useGameActions } from '@entities/game/model/hooks';
import { GoogleIcon, ModalShell } from '@shared/ui';

export default function SettingsModal() {
  const router = useRouter();
  const { isAnonymous, signOut, deleteAccount } = useAuth();
  const { requestLogin, requestLink } = useGoogleConsent();
  const { isAdmin } = useIsAdmin();
  const { reset, closeModal } = useGameActions();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleGoToAdmin = () => {
    closeModal();
    router.push('/admin');
  };

  const handleLinkGoogle = () => requestLink();

  const handleSignInGoogle = () => requestLogin();

  const handleLogout = () => {
    closeModal();
    signOut()
      .then(() => router.push('/'))
      .catch(() => {});
  };

  const handleDeleteAccount = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteAccount()
      .then(() => {
        window.location.href = '/';
      })
      .catch(() => {});
  };

  const handleGoToSelect = () => {
    closeModal();
    router.push('/');
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    reset();
    closeModal();
  };

  return (
    <ModalShell
      onClose={closeModal}
      maxWidth="max-w-xs"
      className="p-4 space-y-3"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-gray-700">설정</h3>
        <button
          onClick={closeModal}
          className="text-gray-400 text-lg leading-none btn-press"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="surface rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-gray-700">계정</div>
            <div className="text-[11px] text-gray-400">
              {isAnonymous ? '게스트' : '구글 연동됨 ✓'}
            </div>
          </div>
          {isAnonymous && (
            <div className="space-y-1.5">
              <button
                onClick={handleLinkGoogle}
                className="w-full py-2 rounded-lg font-bold text-xs btn-press bg-white border border-gray-200 text-gray-700 flex items-center justify-center gap-1.5 shadow-game-sm"
              >
                <GoogleIcon size={14} />
                지금 진행도 구글에 묶기
              </button>
              <button
                onClick={handleSignInGoogle}
                className="w-full py-1.5 rounded-lg text-[11px] btn-press text-blue-500 hover:text-blue-600"
              >
                다른 기기 데이터 가져오기 →
              </button>
              <div className="text-[10px] text-gray-400 leading-relaxed pt-0.5">
                연동: 지금 게스트 진행도를 구글에 보관
                <br />
                가져오기: 구글로 다시 로그인해 다른 기기 데이터 불러오기
              </div>
            </div>
          )}
          {!isAnonymous && (
            <div className="space-y-1.5">
              <button
                onClick={handleLogout}
                className="w-full py-2 rounded-lg font-bold text-xs btn-press bg-white border border-gray-200 text-gray-700 shadow-game-sm"
              >
                로그아웃
              </button>
              <button
                onClick={handleDeleteAccount}
                className={`w-full py-2 rounded-lg font-bold text-xs btn-press transition-colors ${
                  confirmDelete
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-400 border border-red-200'
                }`}
              >
                {confirmDelete ? '정말 탈퇴할래요? (되돌릴 수 없어요)' : '회원 탈퇴'}
              </button>
              <div className="text-[10px] text-gray-400 leading-relaxed pt-0.5">
                탈퇴하면 계정과 모든 게임 데이터가 영구 삭제돼요.
              </div>
            </div>
          )}
        </div>

        <div className="surface rounded-xl p-3 space-y-2">
          <div>
            <div className="text-xs font-bold text-gray-700">
              다른 친구 키우러 가기
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              지금 친구는 그대로 두고 캐릭터 선택으로
            </div>
          </div>
          <button
            onClick={handleGoToSelect}
            className="w-full py-2 rounded-lg font-bold text-xs btn-press bg-white border border-gray-200 text-gray-700 shadow-game-sm"
          >
            캐릭터 선택으로
          </button>
        </div>

        <div className="surface rounded-xl p-3 space-y-2">
          <div>
            <div className="text-xs font-bold text-gray-700">게임 초기화</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              처음부터 다시 키우기 · 코인/해금은 유지
            </div>
          </div>
          <button
            onClick={handleReset}
            className={`w-full py-2 rounded-lg font-bold text-xs btn-press transition-colors ${
              confirmReset
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-400 border border-red-200'
            }`}
          >
            {confirmReset ? '정말 초기화할래요?' : '초기화'}
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={handleGoToAdmin}
            className="w-full surface rounded-xl p-3 text-left btn-press flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-gray-700">
                관리자 페이지
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                콘텐츠(대사·캐릭터·퀴즈) 편집
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        )}
      </div>

      <div className="text-center text-[10px] text-gray-400">
        PLCO GOTCHI · v1.0.0
      </div>
    </ModalShell>
  );
}
