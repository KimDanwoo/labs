'use client';

import { activeCharacterIdAtom, isLoadedAtom } from '@entities/game/model/store';
import { EggLoading } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { CHARACTER_SELECT_STEP } from './model/constants';
import { useVisibleCharacters } from './model/hooks';
import { pendingCharacterAtom, stepAtom } from './model/store';
import { CharacterCarousel, FriendList, IntroScreen, NicknameScreen } from './ui';

export default function CharacterSelectView() {
  const setActiveCharacterId = useSetAtom(activeCharacterIdAtom);
  const setStep = useSetAtom(stepAtom);
  const setPending = useSetAtom(pendingCharacterAtom);
  const step = useAtomValue(stepAtom);
  const pending = useAtomValue(pendingCharacterAtom);
  const isLoaded = useAtomValue(isLoadedAtom);
  const visibleCharacters = useVisibleCharacters();

  useEffect(() => {
    setActiveCharacterId(null);
    setStep(CHARACTER_SELECT_STEP.INTRO);
    setPending(null);
  }, [setActiveCharacterId, setStep, setPending]);

  if (!isLoaded) return <EggLoading />;

  if (step === CHARACTER_SELECT_STEP.NAME && pending) return <NicknameScreen />;

  if (visibleCharacters.length > 0) return <FriendList />;

  if (step === CHARACTER_SELECT_STEP.CAROUSEL) return <CharacterCarousel />;

  return <IntroScreen />;
}
