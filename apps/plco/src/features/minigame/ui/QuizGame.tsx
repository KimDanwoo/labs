'use client';

import { CharacterSprite } from '@shared/ui';
import { QUIZ_OK_THRESHOLD, QUIZ_PHASE, QUIZ_ROUNDS } from '../model/constants';
import { useQuizEngine } from '../model/hooks';
import MinigameReadyScreen from './MinigameReadyScreen';
import MinigameRewardSummary from './MinigameRewardSummary';
import QuizProgressDots from './QuizProgressDots';

type QuizGameProps = { onExitToMenu: () => void };

export default function QuizGame({ onExitToMenu }: QuizGameProps) {
  const {
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
  } = useQuizEngine();

  if (phase === QUIZ_PHASE.READY) {
    return (
      <MinigameReadyScreen
        canPlay={minigame.canPlay}
        cooldownRemainingMs={minigame.cooldownRemainingMs}
        onStart={startGame}
        onExitToMenu={onExitToMenu}
        accentColor="#A78BFA"
        errorMessage={errorMessage}
      >
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
      </MinigameReadyScreen>
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
