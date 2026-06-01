'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { CharacterId } from '@shared/types';
import {
  COINS_PER_MEETING,
  MEETING_PERFECT_COIN_BONUS,
  MEETING_REWARD_AWKWARD,
  MEETING_REWARD_GOOD,
  MEETING_REWARD_OK,
  MEETING_ROUNDS,
} from '@shared/constants';
import { formatDateKey } from '@shared/lib';
import { characterIdAtom } from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import {
  CONVERSATION_OUTCOME,
  MEETING_CHARACTERS,
  MEETING_FOUND_MS,
  MEETING_MATCHING_MS,
  MEETING_PHASE,
  MEETING_RANDOM_NAMES,
  MEETING_REACTION_MS,
  pickScenesForCharacter,
} from '../constants';
import type {
  ConversationOption,
  ConversationOutcome,
  MeetingPhase,
} from '../types';

function rewardOf(outcome: ConversationOutcome): number {
  if (outcome === CONVERSATION_OUTCOME.GOOD) return MEETING_REWARD_GOOD;
  if (outcome === CONVERSATION_OUTCOME.OK) return MEETING_REWARD_OK;
  return MEETING_REWARD_AWKWARD;
}

export function useMeetingChat() {
  const myCharacterId = useAtomValue(characterIdAtom);
  const { completeMeeting, closeModal } = useGameActions();

  const [phase, setPhase] = useState<MeetingPhase>(MEETING_PHASE.SEARCHING);
  const [metCharacter, setMetCharacter] = useState<CharacterId | null>(null);
  const [metName, setMetName] = useState('');
  const [roundIdx, setRoundIdx] = useState(0);
  const [outcomes, setOutcomes] = useState<ConversationOutcome[]>([]);
  const [lastReaction, setLastReaction] = useState<string | null>(null);

  const scenes = useMemo(
    () =>
      metCharacter ? pickScenesForCharacter(metCharacter, MEETING_ROUNDS) : [],
    [metCharacter],
  );

  useEffect(() => {
    if (!myCharacterId) return;
    const candidates = MEETING_CHARACTERS.filter((c) => c !== myCharacterId);
    const timer = setTimeout(() => {
      const randomChar =
        candidates[Math.floor(Math.random() * candidates.length)];
      const randomName =
        MEETING_RANDOM_NAMES[
          Math.floor(Math.random() * MEETING_RANDOM_NAMES.length)
        ];
      setMetCharacter(randomChar);
      setMetName(randomName);
      setPhase(MEETING_PHASE.FOUND);
    }, MEETING_MATCHING_MS);

    return () => clearTimeout(timer);
  }, [myCharacterId]);

  useEffect(() => {
    if (phase !== MEETING_PHASE.FOUND) return;
    const timer = setTimeout(
      () => setPhase(MEETING_PHASE.CHAT),
      MEETING_FOUND_MS,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  const handlePick = (option: ConversationOption) => {
    const newOutcomes = [...outcomes, option.outcome];
    setOutcomes(newOutcomes);
    setLastReaction(option.reaction);

    setTimeout(() => {
      setLastReaction(null);
      if (newOutcomes.length >= MEETING_ROUNDS) {
        setPhase(MEETING_PHASE.RESULT);
      } else {
        setRoundIdx((i) => i + 1);
      }
    }, MEETING_REACTION_MS);
  };

  const totalHearts = outcomes.reduce((sum, o) => sum + rewardOf(o), 0);
  const isPerfect =
    outcomes.length === MEETING_ROUNDS &&
    outcomes.every((o) => o === CONVERSATION_OUTCOME.GOOD);
  const coinsReward =
    COINS_PER_MEETING + (isPerfect ? MEETING_PERFECT_COIN_BONUS : 0);

  const handleFinish = () => {
    completeMeeting({
      hearts: totalHearts,
      coins: coinsReward,
      day: formatDateKey(new Date()),
    });
    closeModal();
  };

  return {
    myCharacterId,
    phase,
    metCharacter,
    metName,
    roundIdx,
    outcomes,
    lastReaction,
    scenes,
    totalHearts,
    isPerfect,
    coinsReward,
    handlePick,
    handleFinish,
  };
}
