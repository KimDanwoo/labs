'use client';

import { useGameActions } from '@entities/game/model/hooks';
import { activeModalAtom, eggReadyCharacterIdAtom } from '@entities/game/model/store';
import { EggModal } from '@features/egg/ui';
import { FeedModal } from '@features/feed/ui';
import { MeetingModal } from '@features/meeting/ui';
import { MiniGameModal } from '@features/minigame/ui';
import { SettingsModal } from '@features/settings/ui';
import { ShopModal } from '@features/shop/ui';
import { MODAL_TYPE } from '@shared/constants';
import { RoomsModal } from '@widgets/rooms/ui';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

const EGG_AUTO_OPEN_DELAY = 100;

export default function ModalRoot() {
  const activeModal = useAtomValue(activeModalAtom);
  const eggReadyCharacterId = useAtomValue(eggReadyCharacterIdAtom);
  const { openModal } = useGameActions();

  useEffect(() => {
    if (!eggReadyCharacterId || activeModal !== null) return undefined;
    const timer = setTimeout(() => openModal(MODAL_TYPE.EGG), EGG_AUTO_OPEN_DELAY);
    return () => clearTimeout(timer);
  }, [eggReadyCharacterId, activeModal, openModal]);

  return (
    <>
      {activeModal === MODAL_TYPE.FEED && <FeedModal />}
      {activeModal === MODAL_TYPE.SHOP && <ShopModal />}
      {activeModal === MODAL_TYPE.MEETING && <MeetingModal />}
      {activeModal === MODAL_TYPE.MINIGAME && <MiniGameModal />}
      {activeModal === MODAL_TYPE.ROOMS && <RoomsModal />}
      {activeModal === MODAL_TYPE.SETTINGS && <SettingsModal />}
      {activeModal === MODAL_TYPE.EGG && eggReadyCharacterId && <EggModal />}
    </>
  );
}
