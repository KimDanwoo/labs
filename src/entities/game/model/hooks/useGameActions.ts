'use client';

import { useMemo } from 'react';
import { useSetAtom } from 'jotai';
import type { FoodId, CharacterId, ModalType } from '@shared/types';
import { gameAtom, activeModalAtom } from '../store';

export function useGameActions() {
  const dispatch = useSetAtom(gameAtom);
  const setModal = useSetAtom(activeModalAtom);

  return useMemo(
    () => ({
      feed: (foodId: FoodId) => dispatch({ type: 'FEED', foodId }),
      cleanPoop: (poopId: string) => dispatch({ type: 'CLEAN_POOP', poopId }),
      cleanAllPoop: () => dispatch({ type: 'CLEAN_ALL_POOP' }),
      addHearts: (amount: number) => dispatch({ type: 'ADD_HEARTS', amount }),
      completeMeeting: (params: { hearts: number; coins: number; day: string }) =>
        dispatch({ type: 'COMPLETE_MEETING', ...params }),
      buyFood: (foodId: FoodId) => dispatch({ type: 'BUY_FOOD', foodId }),
      exchangeHearts: (amount: number) =>
        dispatch({ type: 'EXCHANGE_HEARTS', amount }),
      giveMedicine: () => dispatch({ type: 'GIVE_MEDICINE' }),
      minigameReward: (params: { correctCount: number }) =>
        dispatch({ type: 'MINIGAME_REWARD', ...params }),
      markMinigamePlayed: () => dispatch({ type: 'MARK_MINIGAME_PLAYED' }),
      collectEgg: () => dispatch({ type: 'COLLECT_EGG' }),
      dismissLevelUp: () => dispatch({ type: 'DISMISS_LEVEL_UP' }),
      dismissFeedingMessage: () =>
        dispatch({ type: 'DISMISS_FEEDING_MESSAGE' }),
      selectCharacter: (characterId: CharacterId, nickname: string) =>
        dispatch({ type: 'SELECT_CHARACTER', characterId, nickname }),
      switchCharacter: (characterId: CharacterId, nickname: string) =>
        dispatch({ type: 'SWITCH_CHARACTER', characterId, nickname }),
      reset: () => dispatch({ type: 'RESET' }),
      wakeUp: () => dispatch({ type: 'WAKE_UP' }),
      openModal: (modal: ModalType) => setModal(modal),
      closeModal: () => setModal(null),
    }),
    [dispatch, setModal],
  );
}
