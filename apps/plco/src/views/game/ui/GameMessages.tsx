'use client';

import { useAtomValue } from 'jotai';
import {
  LEVEL_UP_TOAST_DURATION,
  OVERFEED_TOAST_DURATION,
} from '@shared/constants';
import { useAutoDismiss } from '@shared/lib';
import {
  feedingMessageAtom,
  levelUpMessageAtom,
} from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import ToastMessage from './ToastMessage';

export default function GameMessages() {
  const levelUpMessage = useAtomValue(levelUpMessageAtom);
  const feedingMessage = useAtomValue(feedingMessageAtom);
  const { dismissLevelUp, dismissFeedingMessage } = useGameActions();

  useAutoDismiss(levelUpMessage, dismissLevelUp, LEVEL_UP_TOAST_DURATION);
  useAutoDismiss(
    feedingMessage,
    dismissFeedingMessage,
    OVERFEED_TOAST_DURATION,
  );

  return (
    <>
      {levelUpMessage && (
        <ToastMessage message={levelUpMessage} icon="🎉" variant="amber" />
      )}
      {feedingMessage && (
        <ToastMessage message={feedingMessage} icon="😣" variant="rose" />
      )}
    </>
  );
}
