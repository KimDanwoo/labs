'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions, useMinigameStatus } from '@entities/game/model/hooks';
import {
  MINIGAME_BAD_EMOJIS,
  MINIGAME_BAD_PENALTY,
  MINIGAME_BAD_SPAWN_RATE,
  MINIGAME_CATCHER_BOTTOM,
  MINIGAME_CATCHER_HEIGHT,
  MINIGAME_CATCHER_SPEED,
  MINIGAME_CATCHER_WIDTH,
  MINIGAME_COMBO_SCORE_THRESHOLD,
  MINIGAME_DURATION,
  MINIGAME_FIELD_HEIGHT,
  MINIGAME_FIELD_WIDTH,
  MINIGAME_FLOAT_MS,
  MINIGAME_FRAME_MS,
  MINIGAME_GOOD_EMOJIS,
  MINIGAME_ITEM_DESPAWN_MARGIN,
  MINIGAME_ITEM_SIZE,
  MINIGAME_ITEM_SPEED_ACCEL,
  MINIGAME_ITEM_SPEED_BASE,
  MINIGAME_ITEM_SPEED_RANDOM,
  MINIGAME_PHASE,
  MINIGAME_SPAWN_INTERVAL_BASE,
  MINIGAME_SPAWN_INTERVAL_MIN,
  MINIGAME_SPAWN_SPEEDUP,
  MINIGAME_SPAWN_SPREAD_MIN,
} from '../constants';
import type { CatchFloat, FallingItem, MinigamePhase } from '../types';

const CATCHER_START_X = MINIGAME_FIELD_WIDTH / 2 - MINIGAME_CATCHER_WIDTH / 2;
const CATCHER_Y =
  MINIGAME_FIELD_HEIGHT - (MINIGAME_CATCHER_BOTTOM + MINIGAME_CATCHER_HEIGHT);

const toCatcherX = (clientX: number, rect: DOMRect): number =>
  Math.max(
    0,
    Math.min(
      MINIGAME_FIELD_WIDTH - MINIGAME_CATCHER_WIDTH,
      clientX - rect.left - MINIGAME_CATCHER_WIDTH / 2,
    ),
  );

type CatchTouchDirection = 'left' | 'right';

export function useCatchEngine() {
  const { minigameReward, markMinigamePlayed, closeModal } = useGameActions();
  const minigame = useMinigameStatus();

  const [phase, setPhase] = useState<MinigamePhase>(MINIGAME_PHASE.READY);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION);
  const [catcherX, setCatcherX] = useState(CATCHER_START_X);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [floats, setFloats] = useState<CatchFloat[]>([]);
  const [badFlashKey, setBadFlashKey] = useState(0);

  const nextId = useRef(0);
  const nextFloatId = useRef(0);
  const gameStart = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const catcherRef = useRef(CATCHER_START_X);
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastSpawn = useRef(0);
  const lastFrameRef = useRef(0);
  const lastSpawnXRef = useRef(-1);
  const fieldPointerActiveRef = useRef(false);

  const startGame = useCallback(() => {
    if (!minigame.canPlay) return;
    markMinigamePlayed();
    setPhase(MINIGAME_PHASE.PLAYING);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setItems([]);
    itemsRef.current = [];
    setFloats([]);
    setBadFlashKey(0);
    setTimeLeft(MINIGAME_DURATION);
    setCatcherX(CATCHER_START_X);
    catcherRef.current = CATCHER_START_X;
    gameStart.current = Date.now();
    nextId.current = 0;
    nextFloatId.current = 0;
    lastSpawn.current = 0;
    lastFrameRef.current = 0;
    lastSpawnXRef.current = -1;
    fieldPointerActiveRef.current = false;
  }, [markMinigamePlayed, minigame.canPlay]);

  useEffect(() => {
    if (phase !== MINIGAME_PHASE.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    const pressed = keysPressed.current;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      pressed.clear();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== MINIGAME_PHASE.PLAYING) return;

    const spawnFloat = (float: CatchFloat) => {
      setFloats((prev) => [...prev, float]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== float.id));
      }, MINIGAME_FLOAT_MS);
    };

    const loop = () => {
      const now = Date.now();
      // dt: 프레임 간격을 60fps 기준 배율로 환산 (탭 복귀 시 폭주 방지)
      const dt =
        lastFrameRef.current > 0
          ? Math.min((now - lastFrameRef.current) / MINIGAME_FRAME_MS, 3)
          : 1;
      lastFrameRef.current = now;

      const elapsed = now - gameStart.current;

      if (elapsed >= MINIGAME_DURATION) {
        setPhase(MINIGAME_PHASE.RESULT);
        setTimeLeft(0);
        setScore(scoreRef.current);
        return;
      }

      setTimeLeft(MINIGAME_DURATION - elapsed);

      if (keysPressed.current.has('ArrowLeft')) {
        catcherRef.current = Math.max(
          0,
          catcherRef.current - MINIGAME_CATCHER_SPEED * dt,
        );
      }
      if (keysPressed.current.has('ArrowRight')) {
        catcherRef.current = Math.min(
          MINIGAME_FIELD_WIDTH - MINIGAME_CATCHER_WIDTH,
          catcherRef.current + MINIGAME_CATCHER_SPEED * dt,
        );
      }
      setCatcherX(catcherRef.current);

      const spawnInterval = Math.max(
        MINIGAME_SPAWN_INTERVAL_MIN,
        MINIGAME_SPAWN_INTERVAL_BASE - elapsed * MINIGAME_SPAWN_SPEEDUP,
      );
      if (now - lastSpawn.current > spawnInterval) {
        const isBad = Math.random() < MINIGAME_BAD_SPAWN_RATE;
        const pool = isBad ? MINIGAME_BAD_EMOJIS : MINIGAME_GOOD_EMOJIS;

        // 직전 스폰 위치에서 최소 간격 이상 떨어진 곳에 배치
        const maxX = MINIGAME_FIELD_WIDTH - MINIGAME_ITEM_SIZE;
        let spawnX = Math.random() * maxX;
        if (
          lastSpawnXRef.current >= 0 &&
          Math.abs(spawnX - lastSpawnXRef.current) < MINIGAME_SPAWN_SPREAD_MIN
        ) {
          const offset =
            MINIGAME_SPAWN_SPREAD_MIN *
            (Math.random() < 0.5 ? 1 : -1) *
            (1 + Math.random() * 0.5);
          spawnX = Math.max(0, Math.min(maxX, lastSpawnXRef.current + offset));
        }
        lastSpawnXRef.current = spawnX;

        const newItem: FallingItem = {
          id: nextId.current++,
          x: spawnX,
          y: -MINIGAME_ITEM_SIZE,
          emoji: pool[Math.floor(Math.random() * pool.length)],
          kind: isBad ? 'bad' : 'good',
          speed:
            MINIGAME_ITEM_SPEED_BASE +
            Math.random() * MINIGAME_ITEM_SPEED_RANDOM +
            elapsed * MINIGAME_ITEM_SPEED_ACCEL,
        };
        itemsRef.current = [...itemsRef.current, newItem];
        lastSpawn.current = now;
      }

      const cx = catcherRef.current;
      let scoreDelta = 0;
      let caughtBad = false;
      const pendingFloats: CatchFloat[] = [];

      const alive = itemsRef.current
        .map((item) => ({ ...item, y: item.y + item.speed * dt }))
        .filter((item) => {
          const isColliding =
            item.y + MINIGAME_ITEM_SIZE >= CATCHER_Y &&
            item.y <= CATCHER_Y + MINIGAME_CATCHER_HEIGHT &&
            item.x + MINIGAME_ITEM_SIZE >= cx &&
            item.x <= cx + MINIGAME_CATCHER_WIDTH;

          if (isColliding) {
            if (item.kind === 'good') {
              // combo 5+ 이상이면 +2, 아니면 +1
              const bonus =
                comboRef.current >= MINIGAME_COMBO_SCORE_THRESHOLD ? 1 : 0;
              const gained = 1 + bonus;
              scoreDelta += gained;
              comboRef.current += 1;
              pendingFloats.push({
                id: nextFloatId.current++,
                x: item.x,
                y: item.y,
                text: bonus > 0 ? `+${gained}🔥` : '+1',
                variant: 'good',
              });
            } else {
              scoreDelta -= MINIGAME_BAD_PENALTY;
              comboRef.current = 0;
              caughtBad = true;
              pendingFloats.push({
                id: nextFloatId.current++,
                x: item.x,
                y: item.y,
                text: `-${MINIGAME_BAD_PENALTY}`,
                variant: 'bad',
              });
            }
            return false;
          }

          if (item.y > MINIGAME_FIELD_HEIGHT + MINIGAME_ITEM_DESPAWN_MARGIN) {
            // 좋은 아이템 놓치면 콤보 리셋
            if (item.kind === 'good') comboRef.current = 0;
            return false;
          }

          return true;
        });

      if (pendingFloats.length > 0) {
        scoreRef.current = Math.max(0, scoreRef.current + scoreDelta);
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        pendingFloats.forEach(spawnFloat);
      }
      if (caughtBad) {
        setBadFlashKey((k) => k + 1);
      }

      itemsRef.current = alive;
      setItems(alive);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase]);

  const handleTouchMove = useCallback((direction: CatchTouchDirection) => {
    if (direction === 'left') {
      keysPressed.current.add('ArrowLeft');
      keysPressed.current.delete('ArrowRight');
    } else {
      keysPressed.current.add('ArrowRight');
      keysPressed.current.delete('ArrowLeft');
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    keysPressed.current.delete('ArrowLeft');
    keysPressed.current.delete('ArrowRight');
  }, []);

  // 필드 직접 드래그 — 캐처가 손가락을 따라온다
  const handleFieldPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      fieldPointerActiveRef.current = true;
      keysPressed.current.clear();
      const rect = e.currentTarget.getBoundingClientRect();
      catcherRef.current = toCatcherX(e.clientX, rect);
      setCatcherX(catcherRef.current);
    },
    [],
  );

  const handleFieldPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!fieldPointerActiveRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      catcherRef.current = toCatcherX(e.clientX, rect);
      setCatcherX(catcherRef.current);
    },
    [],
  );

  const handleFieldPointerUp = useCallback(() => {
    fieldPointerActiveRef.current = false;
  }, []);

  const handleFinish = useCallback(() => {
    minigameReward({ correctCount: score });
    closeModal();
  }, [score, minigameReward, closeModal]);

  const progressPercent = (timeLeft / MINIGAME_DURATION) * 100;

  return {
    minigame,
    phase,
    score,
    combo,
    timeLeft,
    catcherX,
    items,
    floats,
    badFlashKey,
    progressPercent,
    startGame,
    handleTouchMove,
    handleTouchEnd,
    handleFieldPointerDown,
    handleFieldPointerMove,
    handleFieldPointerUp,
    handleFinish,
  };
}
