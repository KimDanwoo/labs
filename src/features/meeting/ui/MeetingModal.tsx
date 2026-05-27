'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { CharacterId } from '@shared/types';
import {
  MEETING_ROUNDS,
  MEETING_REWARD_GOOD,
  MEETING_REWARD_OK,
  MEETING_REWARD_AWKWARD,
  MEETING_PERFECT_COIN_BONUS,
  COINS_PER_MEETING,
} from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { characterIdAtom, useGameActions } from '@entities/game';
import {
  MEETING_CHARACTERS,
  MEETING_RANDOM_NAMES,
  MEETING_MATCHING_MS,
  MEETING_FOUND_MS,
  pickScenesForCharacter,
} from '../model';
import type { ConversationOption, ConversationOutcome } from '../model';

type Phase = 'searching' | 'found' | 'chat' | 'result';

function rewardOf(outcome: ConversationOutcome): number {
  if (outcome === 'good') return MEETING_REWARD_GOOD;
  if (outcome === 'ok') return MEETING_REWARD_OK;
  return MEETING_REWARD_AWKWARD;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MeetingModal() {
  const myCharacterId = useAtomValue(characterIdAtom);
  const { completeMeeting, closeModal } = useGameActions();

  const [phase, setPhase] = useState<Phase>('searching');
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
      setPhase('found');
    }, MEETING_MATCHING_MS);

    return () => clearTimeout(timer);
  }, [myCharacterId]);

  useEffect(() => {
    if (phase !== 'found') return;
    const timer = setTimeout(() => setPhase('chat'), MEETING_FOUND_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const handlePick = (option: ConversationOption) => {
    const newOutcomes = [...outcomes, option.outcome];
    setOutcomes(newOutcomes);
    setLastReaction(option.reaction);

    setTimeout(() => {
      setLastReaction(null);
      if (newOutcomes.length >= MEETING_ROUNDS) {
        setPhase('result');
      } else {
        setRoundIdx((i) => i + 1);
      }
    }, 1200);
  };

  const totalHearts = outcomes.reduce((sum, o) => sum + rewardOf(o), 0);
  const isPerfect =
    outcomes.length === MEETING_ROUNDS &&
    outcomes.every((o) => o === 'good');
  const coinsReward = COINS_PER_MEETING + (isPerfect ? MEETING_PERFECT_COIN_BONUS : 0);

  const handleFinish = () => {
    completeMeeting({
      hearts: totalHearts,
      coins: coinsReward,
      day: todayKey(),
    });
    closeModal();
  };

  if (!myCharacterId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 modal-overlay"
        onClick={phase === 'result' ? handleFinish : undefined}
      />
      <div className="relative w-full max-w-sm modal-content p-6 mx-4 text-center space-y-5 animate-scale-in">
        {phase === 'searching' && (
          <>
            <h3 className="text-lg font-bold text-gray-700">만남의 방</h3>
            <div className="text-4xl animate-bounce">💌</div>
            <p className="text-sm text-gray-500">친구를 찾고 있어요...</p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-pink-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </>
        )}

        {phase === 'found' && metCharacter && (
          <>
            <h3 className="text-lg font-bold text-pink-500">친구를 만났어요!</h3>
            <div className="flex justify-center items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <CharacterSprite characterId={myCharacterId} size={56} />
                <span className="text-xs font-bold text-gray-500">나</span>
              </div>
              <div className="text-2xl heart-effect">💕</div>
              <div className="flex flex-col items-center gap-1">
                <CharacterSprite characterId={metCharacter} size={56} />
                <span className="text-xs font-bold text-gray-500">{metName}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">잠시 후 대화가 시작돼요</p>
          </>
        )}

        {phase === 'chat' && metCharacter && (
          <>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span className="font-bold text-pink-400">
                {metName}와의 대화
              </span>
              <span>
                {roundIdx + 1} / {MEETING_ROUNDS}
              </span>
            </div>

            <div className="flex justify-center">
              <CharacterSprite characterId={metCharacter} size={64} />
            </div>

            {lastReaction ? (
              <div className="min-h-[88px] flex items-center justify-center">
                <div className="px-4 py-3 rounded-2xl bg-pink-50 text-sm text-pink-600 font-medium animate-fade-in-up">
                  {lastReaction}
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 rounded-2xl bg-gray-50 text-sm text-gray-700 font-medium min-h-[60px] flex items-center justify-center">
                  {scenes[roundIdx].prompt}
                </div>

                <div className="space-y-2">
                  {scenes[roundIdx].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handlePick(opt)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 font-bold btn-press hover:border-pink-300 hover:bg-pink-50 transition-colors text-left"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-center gap-1.5 pt-1">
              {Array.from({ length: MEETING_ROUNDS }).map((_, i) => {
                const o = outcomes[i];
                const color =
                  o === 'good'
                    ? 'bg-pink-400'
                    : o === 'ok'
                      ? 'bg-amber-300'
                      : o === 'awkward'
                        ? 'bg-gray-300'
                        : 'bg-gray-100';
                return (
                  <div key={i} className={`w-6 h-1.5 rounded-full ${color}`} />
                );
              })}
            </div>
          </>
        )}

        {phase === 'result' && metCharacter && (
          <>
            <h3
              className={`text-lg font-bold ${isPerfect ? 'text-pink-500' : 'text-gray-700'}`}
            >
              {isPerfect
                ? '완벽한 만남이었어요! ✨'
                : totalHearts >= MEETING_REWARD_GOOD * 2
                  ? '즐거운 시간을 보냈어요!'
                  : totalHearts > 0
                    ? '나쁘지 않은 만남이었어요'
                    : '어색했어요... 😅'}
            </h3>

            <div className="flex justify-center items-center gap-6">
              <CharacterSprite characterId={myCharacterId} size={56} />
              <div className="text-2xl">{isPerfect ? '💕' : '👋'}</div>
              <CharacterSprite characterId={metCharacter} size={56} />
            </div>

            <div className="flex justify-center gap-6 text-sm">
              <div>
                <div className="font-bold text-pink-400">💕 +{totalHearts}</div>
                <div className="text-[10px] text-gray-400">행복도</div>
              </div>
              <div>
                <div className="font-bold text-amber-500">🪙 +{coinsReward}</div>
                <div className="text-[10px] text-gray-400">
                  {isPerfect ? '+보너스' : '코인'}
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-pink-400 text-white font-bold btn-press"
            >
              받기!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
