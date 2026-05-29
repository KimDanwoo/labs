'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import type { CharacterId } from '@shared/types';
import {
  activeCharacterIdAtom,
  characterStatesAtom,
  isLoadedAtom,
} from '@entities/game/model/store';
import { EggLoading } from '@shared/ui';
import GameView from '@views/game/GameView';

const VALID_IDS = new Set<string>(ALL_CHARACTER_IDS);

export default function PlayPage() {
  const params = useParams<{ characterId: string }>();
  const router = useRouter();
  const setActiveCharacterId = useSetAtom(activeCharacterIdAtom);
  const characterStates = useAtomValue(characterStatesAtom);
  const isLoaded = useAtomValue(isLoadedAtom);

  const characterId = params?.characterId;

  useEffect(() => {
    if (!characterId || !VALID_IDS.has(characterId)) {
      router.replace('/');
      return;
    }
    setActiveCharacterId(characterId as CharacterId);
  }, [characterId, router, setActiveCharacterId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!characterId) return;
    if (!VALID_IDS.has(characterId)) return;
    if (!characterStates[characterId]) {
      router.replace('/');
    }
  }, [isLoaded, characterId, characterStates, router]);

  if (!characterId || !VALID_IDS.has(characterId)) return null;
  if (!isLoaded) return <EggLoading />;
  if (!characterStates[characterId]) return null;

  return <GameView />;
}
