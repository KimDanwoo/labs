'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  MINIGAME_COIN_PER_CORRECT,
  MINIGAME_HEART_PER_CORRECT,
} from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { characterIdAtom } from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import {
  RUN_BEST_SCORE_KEY,
  RUN_CHAR_SIZE,
  RUN_CHAR_X,
  RUN_FIELD_HEIGHT,
  RUN_FIELD_WIDTH,
  RUN_GRAVITY,
  RUN_GROUND_HEIGHT,
  RUN_HEART_EMOJI,
  RUN_HEART_SIZE,
  RUN_HEART_SPAWN_INTERVAL_BASE,
  RUN_HEART_SPAWN_INTERVAL_MIN,
  RUN_HEART_Y_MAX,
  RUN_HEART_Y_MIN,
  RUN_JUMP_VELOCITY,
  RUN_OBSTACLE_EMOJIS,
  RUN_OBSTACLE_SIZE,
  RUN_OBSTACLE_SPEED_ACCEL,
  RUN_OBSTACLE_SPEED_BASE,
  RUN_REWARD_CAP,
  RUN_SCORE_GOOD,
  RUN_SCORE_OK,
  RUN_SPAWN_INTERVAL_BASE,
  RUN_SPAWN_INTERVAL_MIN,
  RUN_SPAWN_SPEEDUP,
  RUN_PHASE,
} from '../model/constants';
import type { RunHeart, RunObstacle, RunPhase } from '../model/types';

type PlcoRunGameProps = {
  onExitToMenu: () => void;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(RUN_BEST_SCORE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function saveBestScore(score: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RUN_BEST_SCORE_KEY, String(score));
}

export default function PlcoRunGame({ onExitToMenu }: PlcoRunGameProps) {
  const { minigameReward, closeModal } = useGameActions();
  const characterId = useAtomValue(characterIdAtom);

  const [phase, setPhase] = useState<RunPhase>(RUN_PHASE.READY);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [charY, setCharY] = useState(0);
  const [obstacles, setObstacles] = useState<RunObstacle[]>([]);
  const [hearts, setHearts] = useState<RunHeart[]>([]);

  const charYRef = useRef(0);
  const charVyRef = useRef(0);
  const obstaclesRef = useRef<RunObstacle[]>([]);
  const heartsRef = useRef<RunHeart[]>([]);
  const scoreRef = useRef(0);
  const nextIdRef = useRef(0);
  const lastObstacleSpawnRef = useRef(0);
  const lastHeartSpawnRef = useRef(0);
  const gameStartRef = useRef(0);
  const animFrameRef = useRef(0);

  const finishGame = useCallback(() => {
    setPhase(RUN_PHASE.RESULT);
    const final = scoreRef.current;
    setScore(final);
    setBestScore((prev) => {
      if (final > prev) {
        saveBestScore(final);
        return final;
      }
      return prev;
    });
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    obstaclesRef.current = [];
    setObstacles([]);
    heartsRef.current = [];
    setHearts([]);
    charYRef.current = 0;
    charVyRef.current = 0;
    setCharY(0);
    nextIdRef.current = 0;
    lastObstacleSpawnRef.current = 0;
    lastHeartSpawnRef.current = 0;
    gameStartRef.current = Date.now();
    setPhase(RUN_PHASE.PLAYING);
  }, []);

  const jump = useCallback(() => {
    if (charYRef.current <= 0.01) {
      charVyRef.current = RUN_JUMP_VELOCITY;
    }
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, jump]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const loop = () => {
      const now = Date.now();
      const elapsed = now - gameStartRef.current;

      charVyRef.current -= RUN_GRAVITY;
      charYRef.current = Math.max(0, charYRef.current + charVyRef.current);
      if (charYRef.current <= 0) charVyRef.current = 0;
      setCharY(charYRef.current);

      const speed = RUN_OBSTACLE_SPEED_BASE + elapsed * RUN_OBSTACLE_SPEED_ACCEL;

      const obstacleSpawnInterval = Math.max(
        RUN_SPAWN_INTERVAL_MIN,
        RUN_SPAWN_INTERVAL_BASE - elapsed * RUN_SPAWN_SPEEDUP,
      );
      if (now - lastObstacleSpawnRef.current > obstacleSpawnInterval) {
        const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
        const minGap = RUN_OBSTACLE_SIZE * 3.5;
        if (!lastObs || RUN_FIELD_WIDTH - lastObs.x >= minGap) {
          obstaclesRef.current = [
            ...obstaclesRef.current,
            {
              id: nextIdRef.current++,
              x: RUN_FIELD_WIDTH,
              emoji:
                RUN_OBSTACLE_EMOJIS[
                  Math.floor(Math.random() * RUN_OBSTACLE_EMOJIS.length)
                ],
            },
          ];
          lastObstacleSpawnRef.current = now;
        }
      }

      const heartSpawnInterval =
        RUN_HEART_SPAWN_INTERVAL_MIN +
        Math.random() *
          (RUN_HEART_SPAWN_INTERVAL_BASE - RUN_HEART_SPAWN_INTERVAL_MIN);
      if (now - lastHeartSpawnRef.current > heartSpawnInterval) {
        const y =
          RUN_HEART_Y_MIN +
          Math.random() * (RUN_HEART_Y_MAX - RUN_HEART_Y_MIN);
        heartsRef.current = [
          ...heartsRef.current,
          {
            id: nextIdRef.current++,
            x: RUN_FIELD_WIDTH,
            y,
          },
        ];
        lastHeartSpawnRef.current = now;
      }

      const charLeft = RUN_CHAR_X;
      const charRight = RUN_CHAR_X + RUN_CHAR_SIZE;
      const charBottom = charYRef.current;
      const charTop = charYRef.current + RUN_CHAR_SIZE;
      const hitboxPadding = 6;

      let collided = false;
      const nextObstacles: RunObstacle[] = [];
      for (const obs of obstaclesRef.current) {
        const movedX = obs.x - speed;
        const obsLeft = movedX;
        const obsRight = movedX + RUN_OBSTACLE_SIZE;
        const obsTop = RUN_OBSTACLE_SIZE;

        const overlapX =
          obsLeft + hitboxPadding < charRight - hitboxPadding &&
          obsRight - hitboxPadding > charLeft + hitboxPadding;
        const overlapY = charBottom < obsTop - hitboxPadding;

        if (overlapX && overlapY) {
          collided = true;
        }

        if (obsRight + RUN_OBSTACLE_SIZE >= 0) {
          nextObstacles.push({ ...obs, x: movedX });
        }

        if (collided) break;
      }
      obstaclesRef.current = nextObstacles;

      let caughtThisFrame = 0;
      const nextHearts: RunHeart[] = [];
      for (const heart of heartsRef.current) {
        const movedX = heart.x - speed;
        const heartLeft = movedX;
        const heartRight = movedX + RUN_HEART_SIZE;
        const heartBottom = heart.y;
        const heartTop = heart.y + RUN_HEART_SIZE;

        const overlapX =
          heartLeft < charRight - hitboxPadding &&
          heartRight > charLeft + hitboxPadding;
        const overlapY =
          heartBottom < charTop - hitboxPadding &&
          heartTop > charBottom + hitboxPadding;

        if (overlapX && overlapY) {
          caughtThisFrame += 1;
          continue;
        }

        if (heartRight >= 0) {
          nextHearts.push({ ...heart, x: movedX });
        }
      }
      heartsRef.current = nextHearts;

      if (caughtThisFrame > 0) {
        scoreRef.current += caughtThisFrame;
        setScore(scoreRef.current);
      }

      setObstacles(obstaclesRef.current);
      setHearts(heartsRef.current);

      if (collided) {
        finishGame();
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, finishGame]);

  const handleFinish = useCallback(() => {
    const reward = Math.min(scoreRef.current, RUN_REWARD_CAP);
    minigameReward({ correctCount: reward, day: todayKey() });
    closeModal();
  }, [minigameReward, closeModal]);

  const isNewBest = phase === RUN_PHASE.RESULT && score > 0 && score >= bestScore;
  const rewardScore = Math.min(score, RUN_REWARD_CAP);

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
        <button
          onClick={startGame}
          className="btn-primary btn-press w-full"
          style={{ backgroundColor: '#22C55E' }}
        >
          시작!
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
          <span className="text-sm font-bold text-pink-500">💖 {score}</span>
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
          className="relative mx-auto rounded-2xl overflow-hidden select-none touch-none cursor-pointer"
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
              background:
                'linear-gradient(180deg, #A7F3D0 0%, #6EE7B7 100%)',
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

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-amber-500">
              🪙 +{rewardScore * MINIGAME_COIN_PER_CORRECT}
            </div>
            <div className="text-[10px] text-gray-400">코인</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-pink-400">
              💕 +{rewardScore * MINIGAME_HEART_PER_CORRECT}
            </div>
            <div className="text-[10px] text-gray-400">행복도</div>
          </div>
        </div>

        {score > RUN_REWARD_CAP && (
          <div className="text-[10px] text-gray-400">
            (보상은 최대 {RUN_REWARD_CAP}개까지)
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={startGame}
            className="flex-1 py-3 rounded-2xl bg-white/80 border border-gray-200 text-gray-600 font-bold btn-press"
          >
            다시!
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
