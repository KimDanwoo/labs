'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { MODAL_TYPE } from '@shared/constants';
import {
  activeModalAtom,
  eggReadyCharacterIdAtom,
} from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import { FeedModal } from '@features/feed/ui';
import { ShopModal } from '@features/shop/ui';
import { MeetingModal } from '@features/meeting/ui';
import { MiniGameModal } from '@features/minigame/ui';
import { EggModal } from '@features/egg/ui';
import { SettingsModal } from '@features/settings/ui';

const EGG_AUTO_OPEN_DELAY = 100;

export default function ModalRoot() {
  const activeModal = useAtomValue(activeModalAtom);
  const eggReadyCharacterId = useAtomValue(eggReadyCharacterIdAtom);
  const { openModal } = useGameActions();

  useEffect(() => {
    if (!eggReadyCharacterId || activeModal !== null) return;
    const timer = setTimeout(() => openModal(MODAL_TYPE.EGG), EGG_AUTO_OPEN_DELAY);
    return () => clearTimeout(timer);
  }, [eggReadyCharacterId, activeModal, openModal]);

  return (
    <>
      {activeModal === MODAL_TYPE.FEED && <FeedModal />}
      {activeModal === MODAL_TYPE.SHOP && <ShopModal />}
      {activeModal === MODAL_TYPE.MEETING && <MeetingModal />}
      {activeModal === MODAL_TYPE.MINIGAME && <MiniGameModal />}
      {activeModal === MODAL_TYPE.SETTINGS && <SettingsModal />}
      {activeModal === MODAL_TYPE.EGG && eggReadyCharacterId && <EggModal />}
    </>
  );
}
