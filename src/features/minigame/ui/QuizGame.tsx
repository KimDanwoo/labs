'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { CHARACTERS } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { characterIdAtom } from '@entities/game/model/store';
import { useGameActions, useMinigameStatus } from '@entities/game/model/hooks';
import { QUIZ_OK_THRESHOLD, QUIZ_PHASE, QUIZ_ROUNDS } from '../model/constants';
import { fetchRandomQuizQuestions } from '../model/services';
import type { QuizPhase, QuizQuestion } from '../model/types';
import MinigameCooldownNotice from './MinigameCooldownNotice';
import MinigameRewardSummary from './MinigameRewardSummary';
import QuizProgressDots from './QuizProgressDots';

type QuizGameProps = {
  onExitToMenu: () => void;
};

export default function QuizGame({ onExitToMenu }: QuizGameProps) {
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

  const handlePick = (index: number) => {
    if (isRevealed || !current) return;
    setPicked(index);
    setResults((prev) => [...prev, index === current.correctIndex]);
  };

  const goNext = () => {
    setPicked(null);
    if (isLastRound) {
      setPhase(QUIZ_PHASE.RESULT);
    } else {
      setRoundIdx((i) => i + 1);
    }
  };

  const startGame = async () => {
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
  };

  const handleFinish = () => {
    minigameReward({ correctCount });
    closeModal();
  };

  if (phase === QUIZ_PHASE.READY) {
    return (
      <div className="space-y-5 py-4">
        <h3 className="text-lg font-bold text-gray-700">
          {myCharacter ? `${myCharacter.name} 취향 퀴즈` : 'PLCO 취향 퀴즈'}
        </h3>
        {myCharacterId ? (
          <div className="flex justify-center py-2">
            <CharacterSprite characterId={myCharacterId} size={72} />
          </div>
        ) : (
          <div className="text-5xl py-2">💡</div>
        )}
        <p className="text-sm text-gray-400 leading-relaxed">
          {myCharacter
            ? `${myCharacter.name}의 진짜 취향을`
            : 'PLCO 멤버들의 진짜 취향을'}
          <br />
          맞춰보세요! 총 {QUIZ_ROUNDS}문제
        </p>
        {!minigame.canPlay && (
          <MinigameCooldownNotice remainingMs={minigame.cooldownRemainingMs} />
        )}
        {errorMessage && (
          <div className="text-[11px] text-red-400">{errorMessage}</div>
        )}
        <button
          onClick={startGame}
          disabled={!minigame.canPlay}
          className="btn-primary btn-press w-full disabled:opacity-40"
          style={{ backgroundColor: '#A78BFA' }}
        >
          {minigame.canPlay ? '시작!' : '에너지 부족'}
        </button>
        <button
          onClick={onExitToMenu}
          className="w-full py-2 text-xs text-gray-400 btn-press"
        >
          다른 게임 고르기
        </button>
      </div>
    );
  }

  if (phase === QUIZ_PHASE.LOADING) {
    return (
      <div className="space-y-4">
        <QuizProgressDots results={[]} currentRound={0} />

        {myCharacterId && (
          <div className="flex justify-center">
            <CharacterSprite characterId={myCharacterId} size={64} />
          </div>
        )}

        <div className="px-4 py-3 rounded-2xl bg-gray-100 min-h-[60px] animate-pulse" />

        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[46px] rounded-xl bg-gray-100 animate-pulse"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === QUIZ_PHASE.PLAYING && current) {
    return (
      <div className="space-y-4">
        <QuizProgressDots results={results} currentRound={roundIdx} />

        <div className="flex justify-center">
          <CharacterSprite characterId={current.characterId} size={64} />
        </div>

        <div className="px-4 py-3 rounded-2xl bg-gray-50 text-sm text-gray-700 font-bold min-h-[60px] flex items-center justify-center text-center">
          {current.question}
        </div>

        <div className="space-y-2">
          {current.options.map((opt, i) => {
            const isCorrectOption = i === current.correctIndex;
            const isPicked = picked === i;

            let stateClass =
              'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50';
            let mark: string | null = null;

            if (isRevealed) {
              if (isCorrectOption) {
                stateClass = 'bg-emerald-50 border-emerald-300 text-emerald-700';
                mark = '✓';
              } else if (isPicked) {
                stateClass = 'bg-rose-50 border-rose-300 text-rose-600';
                mark = '✗';
              } else {
                stateClass = 'bg-white border-gray-100 text-gray-300';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                disabled={isRevealed}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-bold btn-press transition-colors text-left flex items-center justify-between gap-2 ${stateClass}`}
              >
                <span>{opt}</span>
                {mark && <span className="text-base leading-none">{mark}</span>}
              </button>
            );
          })}
        </div>

        {isRevealed && (
          <div className="space-y-3 animate-fade-in-up">
            <div
              className={`text-sm font-bold ${
                isCurrentCorrect ? 'text-emerald-500' : 'text-rose-400'
              }`}
            >
              {isCurrentCorrect ? '정답이에요! 🎉' : '아쉬워요 😅'}
            </div>
            <div className="px-4 py-3 rounded-2xl bg-violet-50 border border-violet-100 text-[12px] text-gray-600 leading-relaxed text-left">
              💡 {current.fact}
            </div>
            <button
              onClick={goNext}
              className="btn-primary btn-press w-full"
              style={{ backgroundColor: '#A78BFA' }}
            >
              {isLastRound ? '결과 보기' : '다음 문제'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === QUIZ_PHASE.RESULT) {
    const allCorrect = correctCount === QUIZ_ROUNDS;
    return (
      <div className="space-y-5 py-4">
        <div className="text-5xl">
          {allCorrect ? '🎉' : correctCount >= QUIZ_OK_THRESHOLD ? '😊' : '😅'}
        </div>
        <h3 className="text-xl font-bold text-gray-700">
          {correctCount} / {QUIZ_ROUNDS} 맞췄어요!
        </h3>
        <QuizProgressDots results={results} currentRound={-1} />
        <MinigameRewardSummary score={correctCount} />
        <button
          onClick={handleFinish}
          className="btn-primary btn-press w-full"
          style={{ backgroundColor: '#A78BFA' }}
        >
          받기!
        </button>
      </div>
    );
  }

  return null;
}
