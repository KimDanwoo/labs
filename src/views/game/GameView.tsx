'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import {
  LEVEL_UP_TOAST_DURATION,
  OVERFEED_TOAST_DURATION,
} from '@shared/constants';
import {
  isLoadedAtom,
  statusAtom,
  characterIdAtom,
  eggReadyCharacterIdAtom,
  levelUpMessageAtom,
  feedingMessageAtom,
  activeModalAtom,
  useGameSync,
  useAutoDecay,
  useCharacterMovement,
  useGameActions,
} from '@entities/game';
import { useAuth } from '@entities/auth';
import { CharacterSelectView } from '@views/character-select';
import { DeathScreen } from '@views/death';
import { StatusBar } from '@widgets/status-bar';
import { Room } from '@widgets/game-room';
import { ActionButtons } from '@widgets/action-bar';
import { FeedModal } from '@features/feed';
import { ShopModal } from '@features/shop';
import { MeetingModal } from '@features/meeting';
import { MiniGameModal } from '@features/minigame';
import { EggModal } from '@features/egg';
import { SettingsModal } from '@features/settings';

export default function GameView() {
  const { user, isLoading: isAuthLoading, signInAnonymously } = useAuth();
  const { openModal, dismissLevelUp, dismissFeedingMessage } = useGameActions();

  useGameSync(user?.id ?? null);
  useAutoDecay();
  useCharacterMovement();

  const isLoaded = useAtomValue(isLoadedAtom);
  const status = useAtomValue(statusAtom);
  const characterId = useAtomValue(characterIdAtom);
  const eggReadyCharacterId = useAtomValue(eggReadyCharacterIdAtom);
  const levelUpMessage = useAtomValue(levelUpMessageAtom);
  const feedingMessage = useAtomValue(feedingMessageAtom);
  const activeModal = useAtomValue(activeModalAtom);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      signInAnonymously().catch(() => {});
    }
  }, [isAuthLoading, user, signInAnonymously]);

  useEffect(() => {
    if (eggReadyCharacterId && activeModal === null) {
      const timer = setTimeout(() => openModal('egg'), 100);
      return () => clearTimeout(timer);
    }
  }, [eggReadyCharacterId, activeModal, openModal]);

  useEffect(() => {
    if (!levelUpMessage) return;
    const timer = setTimeout(dismissLevelUp, LEVEL_UP_TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [levelUpMessage, dismissLevelUp]);

  useEffect(() => {
    if (!feedingMessage) return;
    const timer = setTimeout(dismissFeedingMessage, OVERFEED_TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [feedingMessage, dismissFeedingMessage]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="text-2xl animate-bounce">🥚</div>
        <p className="text-sm text-gray-400 mt-2">로딩 중...</p>
      </div>
    );
  }

  if (status === 'selecting') return <CharacterSelectView />;
  if (status === 'dead' && characterId) return <DeathScreen />;
  if (!characterId) return null;

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-3 gap-2 sm:gap-3">
      <StatusBar />
      <Room />
      <ActionButtons />

      {levelUpMessage && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm text-amber-700 animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg, #FFF7E6 0%, #FFE8B0 100%)',
            boxShadow:
              '0 8px 24px rgba(255, 183, 0, 0.2), 0 2px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(255, 183, 0, 0.3)',
          }}
        >
          🎉 {levelUpMessage}
        </div>
      )}

      {feedingMessage && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm text-rose-600 animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
            boxShadow:
              '0 8px 24px rgba(244, 63, 94, 0.18), 0 2px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}
        >
          😣 {feedingMessage}
        </div>
      )}

      {activeModal === 'feed' && <FeedModal />}
      {activeModal === 'shop' && <ShopModal />}
      {activeModal === 'meeting' && <MeetingModal />}
      {activeModal === 'minigame' && <MiniGameModal />}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'egg' && eggReadyCharacterId && <EggModal />}
    </div>
  );
}
