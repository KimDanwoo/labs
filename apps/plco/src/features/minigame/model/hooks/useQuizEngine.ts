'use client';

import { useGameActions, useMinigameStatus } from '@entities/game/model/hooks';
import { characterIdAtom } from '@entities/game/model/store';
import { QUIZ_PHASE, QUIZ_ROUNDS } from '@features/minigame/model/constants';
import { fetchRandomQuizQuestions } from '@features/minigame/model/services';
import type { QuizPhase, QuizQuestion } from '@features/minigame/model/types';
import { CHARACTERS } from '@shared/constants';
import { useAtomValue } from 'jotai';
import { useCallback, useState } from 'react';

export function useQuizEngine() {
  const myCharacterId = useAtomValue(characterIdAtom);
  const { minigameReward, markMinigamePlayed, closeModal } = useGameActions();
  const minigame = useMinigameStatus();

  const [phase, setPhase] = useState<QuizPhase>(QUIZ_PHASE.READY);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const current = questions[roundIdx];
  const myCharacter = myCharacterId ? CHARACTERS[myCharacterId] : null;
  const isRevealed = picked !== null;
  const isLastRound = roundIdx + 1 >= QUIZ_ROUNDS;
  const correctCount = results.filter(Boolean).length;
  const isCurrentCorrect = isRevealed && picked === current?.correctIndex;

  const handlePick = useCallback(
    (index: number) => {
      if (isRevealed || !current) return;
      setPicked(index);
      setResults((prev) => [...prev, index === current.correctIndex]);
    },
    [isRevealed, current],
  );

  const goNext = useCallback(() => {
    setPicked(null);
    if (isLastRound) {
      setPhase(QUIZ_PHASE.RESULT);
    } else {
      setRoundIdx((i) => i + 1);
    }
  }, [isLastRound]);

  const startGame = useCallback(async () => {
    if (!minigame.canPlay || !myCharacterId) return;
    setErrorMessage(null);
    setPhase(QUIZ_PHASE.LOADING);
    try {
      const fetched = await fetchRandomQuizQuestions(myCharacterId, QUIZ_ROUNDS);
      if (fetched.length < QUIZ_ROUNDS) {
        throw new Error('문제를 충분히 받지 못했어요');
      }
      markMinigamePlayed();
      setQuestions(fetched);
      setRoundIdx(0);
      setResults([]);
      setPicked(null);
      setPhase(QUIZ_PHASE.PLAYING);
    } catch {
      setErrorMessage('문제를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      setPhase(QUIZ_PHASE.READY);
    }
  }, [minigame.canPlay, myCharacterId, markMinigamePlayed]);

  const handleFinish = useCallback(() => {
    minigameReward({ correctCount });
    closeModal();
  }, [correctCount, minigameReward, closeModal]);

  return {
    minigame,
    myCharacterId,
    myCharacter,
    phase,
    current,
    roundIdx,
    picked,
    results,
    errorMessage,
    isRevealed,
    isLastRound,
    correctCount,
    isCurrentCorrect,
    startGame,
    handlePick,
    goNext,
    handleFinish,
  };
}
