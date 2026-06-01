'use client';

import { useAtomValue } from 'jotai';
import { CharacterSprite } from '@shared/ui';
import { characterIdAtom } from '@entities/game/model/store';
import {
  RUN_CHAR_SIZE,
  RUN_CHAR_X,
  RUN_FIELD_HEIGHT,
  RUN_FIELD_WIDTH,
  RUN_GROUND_HEIGHT,
  RUN_HEART_EMOJI,
  RUN_HEART_SIZE,
  RUN_OBSTACLE_SIZE,
  RUN_PHASE,
  RUN_REWARD_CAP,
  RUN_SCORE_GOOD,
  RUN_SCORE_OK,
} from '../model/constants';
import { useRunEngine } from '../model/hooks';
import MinigameCooldownNotice from './MinigameCooldownNotice';
import MinigameRewardSummary from './MinigameRewardSummary';

type PlcoRunGameProps = {
  onExitToMenu: () => void;
};

export default function PlcoRunGame({ onExitToMenu }: PlcoRunGameProps) {
  const characterId = useAtomValue(characterIdAtom);
  const {
    minigame,
    phase,
    score,
    scorePulseKey,
    bestScore,
    charY,
    charTilt,
    obstacles,
    hearts,
    pickups,
    countdown,
    isCrashing,
    isNewBest,
    rewardScore,
    startGame,
    jump,
    handleFinish,
  } = useRunEngine();

  if (phase === RUN_PHASE.READY) {
    return (
      <div className="space-y-4 py-3">
        <h3 className="text-lg font-bold text-gray-700">플코런!</h3>
        <div className="text-5xl py-1">🏃</div>
        <p className="text-sm text-gray-400 leading-relaxed">
          탭/Space로 점프! 장애물은 피하고
          <br />
          💖 하트를 모아 행복도를 채워요
        </p>
        {bestScore > 0 && (
          <div className="text-xs text-amber-500 font-bold">
            🏆 최고기록 {bestScore}개
          </div>
        )}
        {!minigame.canPlay && (
          <MinigameCooldownNotice remainingMs={minigame.cooldownRemainingMs} />
        )}
        <button
          onClick={startGame}
          disabled={!minigame.canPlay}
          className="btn-primary btn-press w-full disabled:opacity-40"
          style={{ backgroundColor: '#22C55E' }}
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

  if (phase === RUN_PHASE.PLAYING) {
    return (
      <>
        <div className="flex items-center justify-between">
          <span
            key={scorePulseKey}
            className="text-sm font-bold text-pink-500 run-score-pulse"
          >
            💖 {score}
          </span>
          <span className="text-[11px] font-bold text-gray-400 tabular-nums">
            BEST {bestScore}
          </span>
        </div>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            jump();
          }}
          className={`relative mx-auto rounded-2xl overflow-hidden select-none touch-none cursor-pointer ${
            isCrashing ? 'run-field-shake' : ''
          }`}
          style={{
            width: RUN_FIELD_WIDTH,
            height: RUN_FIELD_HEIGHT,
            background:
              'linear-gradient(180deg, #DBEAFE 0%, #ECFDF5 60%, #D1FAE5 100%)',
          }}
        >
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: RUN_GROUND_HEIGHT,
              background: 'linear-gradient(180deg, #A7F3D0 0%, #6EE7B7 100%)',
              borderTop: '2px dashed rgba(16,185,129,0.4)',
            }}
          />

          <div
            className="absolute"
            style={{
              left: RUN_CHAR_X,
              bottom: RUN_GROUND_HEIGHT + charY,
              width: RUN_CHAR_SIZE,
              height: RUN_CHAR_SIZE,
              transform: `rotate(${charTilt}deg)`,
              transformOrigin: 'center bottom',
              transition: 'transform 60ms linear',
            }}
          >
            {characterId ? (
              <CharacterSprite
                characterId={characterId}
                size={RUN_CHAR_SIZE}
                direction="right"
                isMoving
              />
            ) : (
              <div className="text-3xl leading-none">🏃</div>
            )}
          </div>

          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute"
              style={{
                left: obs.x,
                bottom: RUN_GROUND_HEIGHT,
                width: RUN_OBSTACLE_SIZE,
                height: RUN_OBSTACLE_SIZE,
                fontSize: RUN_OBSTACLE_SIZE,
                lineHeight: 1,
              }}
            >
              {obs.emoji}
            </div>
          ))}

          {hearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute"
              style={{
                left: heart.x,
                bottom: RUN_GROUND_HEIGHT + heart.y,
                width: RUN_HEART_SIZE,
                height: RUN_HEART_SIZE,
                fontSize: RUN_HEART_SIZE,
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 3px rgba(244,63,94,0.25))',
              }}
            >
              {RUN_HEART_EMOJI}
            </div>
          ))}

          {pickups.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none run-pickup-text"
              style={{
                left: p.x,
                bottom: RUN_GROUND_HEIGHT + p.y + RUN_HEART_SIZE / 2,
              }}
            >
              +1
            </div>
          ))}

          {isCrashing && (
            <div className="absolute inset-0 pointer-events-none bg-red-400/40 run-collision-flash" />
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-white/20 backdrop-blur-[1px]">
              <span
                key={countdown}
                className="text-5xl font-black text-white run-countdown-pop"
                style={{
                  textShadow:
                    '0 2px 4px rgba(0,0,0,0.25), 0 0 8px rgba(236,72,153,0.4)',
                }}
              >
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </div>
          )}
        </button>

        <p className="text-[11px] text-gray-400">
          탭 또는 Space로 점프해서 💖를 잡아요
        </p>
      </>
    );
  }

  if (phase === RUN_PHASE.RESULT) {
    return (
      <div className="space-y-4 py-3">
        <div className="text-5xl">
          {score >= RUN_SCORE_GOOD ? '🏆' : score >= RUN_SCORE_OK ? '🎉' : '😅'}
        </div>
        <h3 className="text-xl font-bold text-gray-700">
          💖 {score}개 모았어요!
        </h3>
        {isNewBest && score > 0 ? (
          <div className="text-sm font-bold text-amber-500">
            🌟 새 최고기록!
          </div>
        ) : (
          <div className="text-xs text-gray-400">최고기록 {bestScore}개</div>
        )}

        <MinigameRewardSummary score={rewardScore} />

        {score > RUN_REWARD_CAP && (
          <div className="text-[10px] text-gray-400">
            (보상은 최대 {RUN_REWARD_CAP}개까지)
          </div>
        )}

        {!minigame.canPlay && (
          <MinigameCooldownNotice remainingMs={minigame.cooldownRemainingMs} />
        )}

        <div className="flex gap-2">
          <button
            onClick={startGame}
            disabled={!minigame.canPlay}
            className="flex-1 py-3 rounded-2xl bg-white/80 border border-gray-200 text-gray-600 font-bold btn-press disabled:opacity-40"
          >
            {minigame.canPlay ? '다시!' : '에너지 부족'}
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 py-3 rounded-2xl text-white font-bold btn-press"
            style={{ backgroundColor: '#22C55E' }}
          >
            받기!
          </button>
        </div>
      </div>
    );
  }

  return null;
}
