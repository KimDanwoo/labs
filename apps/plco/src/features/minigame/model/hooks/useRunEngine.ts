'use client';

import { useGameActions, useMinigameStatus } from '@entities/game/model/hooks';
import {
  RUN_BEST_SCORE_KEY,
  RUN_CHAR_SIZE,
  RUN_CHAR_X,
  RUN_COUNTDOWN_FINISH_MS,
  RUN_COUNTDOWN_STEP_MS,
  RUN_CRASH_DURATION_MS,
  RUN_FIELD_WIDTH,
  RUN_FRAME_MS,
  RUN_GRAVITY_FALL,
  RUN_GRAVITY_RISE,
  RUN_GROUND_EPSILON,
  RUN_HEART_HITBOX_PADDING,
  RUN_HEART_SIZE,
  RUN_HEART_SPAWN_INTERVAL_BASE,
  RUN_HEART_SPAWN_INTERVAL_MIN,
  RUN_HEART_Y_TIERS,
  RUN_HITBOX_PADDING,
  RUN_JUMP_BUFFER_MS,
  RUN_JUMP_CUT_VELOCITY,
  RUN_JUMP_FORGIVE_HEIGHT,
  RUN_JUMP_VELOCITY,
  RUN_MAX_FRAME_STEP,
  RUN_MIN_GAP_FACTOR,
  RUN_OBSTACLE_EMOJIS,
  RUN_OBSTACLE_SIZE,
  RUN_OBSTACLE_SPEED_ACCEL,
  RUN_OBSTACLE_SPEED_BASE,
  RUN_OBSTACLE_SPEED_MAX,
  RUN_PHASE,
  RUN_PICKUP_FLOAT_MS,
  RUN_REWARD_CAP,
  RUN_SPAWN_INTERVAL_BASE,
  RUN_SPAWN_INTERVAL_MIN,
  RUN_SPAWN_SPEEDUP,
  RUN_TILT_FACTOR,
  RUN_TILT_MAX,
} from '@features/minigame/model/constants';
import type { RunHeart, RunObstacle, RunPhase, RunPickup } from '@features/minigame/model/types';
import { pickRandom, readLocalInt, writeLocalInt } from '@shared/lib';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useRunEngine() {
  const { minigameReward, markMinigamePlayed, closeModal } = useGameActions();
  const minigame = useMinigameStatus();

  const [phase, setPhase] = useState<RunPhase>(RUN_PHASE.READY);
  const [score, setScore] = useState(0);
  const [scorePulseKey, setScorePulseKey] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => readLocalInt(RUN_BEST_SCORE_KEY));
  const [charY, setCharY] = useState(0);
  const [charTilt, setCharTilt] = useState(0);
  const [obstacles, setObstacles] = useState<RunObstacle[]>([]);
  const [hearts, setHearts] = useState<RunHeart[]>([]);
  const [pickups, setPickups] = useState<RunPickup[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCrashing, setIsCrashing] = useState(false);

  const charYRef = useRef(0);
  const charVyRef = useRef(0);
  const obstaclesRef = useRef<RunObstacle[]>([]);
  const heartsRef = useRef<RunHeart[]>([]);
  const scoreRef = useRef(0);
  const nextIdRef = useRef(0);
  const lastObstacleSpawnRef = useRef(0);
  const lastHeartSpawnRef = useRef(0);
  const gameStartRef = useRef(0);
  const lastFrameRef = useRef(0);
  const animFrameRef = useRef(0);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const jumpBufferedRef = useRef(false);
  const jumpBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpHeldRef = useRef(false);

  const finishGame = useCallback(() => {
    setPhase(RUN_PHASE.RESULT);
    const final = scoreRef.current;
    setScore(final);
    setBestScore((prev) => {
      if (final > prev) {
        writeLocalInt(RUN_BEST_SCORE_KEY, final);
        return final;
      }
      return prev;
    });
  }, []);

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((t) => clearTimeout(t));
    countdownTimersRef.current = [];
  }, []);

  const startGame = useCallback(() => {
    if (!minigame.canPlay) return;
    markMinigamePlayed();
    scoreRef.current = 0;
    setScore(0);
    obstaclesRef.current = [];
    setObstacles([]);
    heartsRef.current = [];
    setHearts([]);
    setPickups([]);
    charYRef.current = 0;
    charVyRef.current = 0;
    setCharY(0);
    setCharTilt(0);
    nextIdRef.current = 0;
    lastObstacleSpawnRef.current = 0;
    lastHeartSpawnRef.current = 0;
    setIsCrashing(false);
    jumpBufferedRef.current = false;
    jumpHeldRef.current = false;
    if (jumpBufferTimerRef.current) {
      clearTimeout(jumpBufferTimerRef.current);
      jumpBufferTimerRef.current = null;
    }
    setPhase(RUN_PHASE.PLAYING);

    clearCountdownTimers();
    setCountdown(3);
    countdownTimersRef.current.push(
      setTimeout(() => setCountdown(2), RUN_COUNTDOWN_STEP_MS),
      setTimeout(() => setCountdown(1), RUN_COUNTDOWN_STEP_MS * 2),
      setTimeout(() => setCountdown(0), RUN_COUNTDOWN_STEP_MS * 3),
      setTimeout(() => {
        setCountdown(null);
        gameStartRef.current = Date.now();
      }, RUN_COUNTDOWN_FINISH_MS),
    );
  }, [clearCountdownTimers, markMinigamePlayed, minigame.canPlay]);

  useEffect(() => clearCountdownTimers, [clearCountdownTimers]);

  useEffect(
    () => () => {
      if (jumpBufferTimerRef.current) clearTimeout(jumpBufferTimerRef.current);
    },
    [],
  );

  const jump = useCallback(() => {
    if (countdown !== null) return;
    jumpHeldRef.current = true;
    // 땅에 있거나 착지 직전(관용 높이 이하로 내려오는 중)이면 즉시 점프.
    const grounded =
      charYRef.current <= RUN_GROUND_EPSILON || (charYRef.current <= RUN_JUMP_FORGIVE_HEIGHT && charVyRef.current <= 0);
    if (grounded) {
      charVyRef.current = RUN_JUMP_VELOCITY;
    } else {
      // 공중에서 탭하면 착지 즉시 점프 발동 (점프 버퍼)
      jumpBufferedRef.current = true;
      if (jumpBufferTimerRef.current) clearTimeout(jumpBufferTimerRef.current);
      jumpBufferTimerRef.current = setTimeout(() => {
        jumpBufferedRef.current = false;
        jumpBufferTimerRef.current = null;
      }, RUN_JUMP_BUFFER_MS);
    }
  }, [countdown]);

  // 버튼/키를 떼면 호출. 아직 상승 중이면 속도를 깎아 점프를 짧게 만든다(가변 높이).
  const releaseJump = useCallback(() => {
    jumpHeldRef.current = false;
    if (charVyRef.current > RUN_JUMP_CUT_VELOCITY) {
      charVyRef.current = RUN_JUMP_CUT_VELOCITY;
    }
  }, []);

  useEffect(() => {
    if (phase !== RUN_PHASE.PLAYING) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        releaseJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, jump, releaseJump]);

  useEffect(() => {
    if (phase !== RUN_PHASE.PLAYING || countdown !== null || isCrashing) return undefined;

    const loop = () => {
      const now = Date.now();
      const elapsed = now - gameStartRef.current;
      // 실제 프레임 간격을 60fps 기준 배율로 환산(탭 복귀 시 폭주 방지 위해 상한).
      const frame = Math.min(RUN_MAX_FRAME_STEP, (now - lastFrameRef.current) / RUN_FRAME_MS);
      lastFrameRef.current = now;

      // 비대칭 중력: 상승 중엔 약하게, 하강 중엔 강하게 → 경쾌하고 반응 좋은 아크.
      const gravity = charVyRef.current > 0 ? RUN_GRAVITY_RISE : RUN_GRAVITY_FALL;
      charVyRef.current -= gravity * frame;
      charYRef.current = Math.max(0, charYRef.current + charVyRef.current * frame);
      if (charYRef.current <= 0) {
        if (jumpBufferedRef.current) {
          jumpBufferedRef.current = false;
          if (jumpBufferTimerRef.current) {
            clearTimeout(jumpBufferTimerRef.current);
            jumpBufferTimerRef.current = null;
          }
          // 버퍼 점프도 손을 뗀 상태면 짧은 홉으로 나간다.
          charVyRef.current = jumpHeldRef.current
            ? RUN_JUMP_VELOCITY
            : Math.min(RUN_JUMP_VELOCITY, RUN_JUMP_CUT_VELOCITY);
        } else {
          charVyRef.current = 0;
        }
      }
      setCharY(charYRef.current);
      setCharTilt(Math.max(-RUN_TILT_MAX, Math.min(RUN_TILT_MAX, -charVyRef.current * RUN_TILT_FACTOR)));

      const speedPerFrame = Math.min(
        RUN_OBSTACLE_SPEED_BASE + elapsed * RUN_OBSTACLE_SPEED_ACCEL,
        RUN_OBSTACLE_SPEED_MAX,
      );
      const speed = speedPerFrame * frame;

      const obstacleSpawnInterval = Math.max(
        RUN_SPAWN_INTERVAL_MIN,
        RUN_SPAWN_INTERVAL_BASE - elapsed * RUN_SPAWN_SPEEDUP,
      );
      if (now - lastObstacleSpawnRef.current > obstacleSpawnInterval) {
        const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
        const minGap = RUN_OBSTACLE_SIZE * RUN_MIN_GAP_FACTOR;
        const obstacleEmoji = pickRandom(RUN_OBSTACLE_EMOJIS);
        if (obstacleEmoji && (!lastObs || RUN_FIELD_WIDTH - lastObs.x >= minGap)) {
          obstaclesRef.current = [
            ...obstaclesRef.current,
            { id: nextIdRef.current++, x: RUN_FIELD_WIDTH, emoji: obstacleEmoji },
          ];
          lastObstacleSpawnRef.current = now;
        }
      }

      const heartSpawnInterval =
        RUN_HEART_SPAWN_INTERVAL_MIN + Math.random() * (RUN_HEART_SPAWN_INTERVAL_BASE - RUN_HEART_SPAWN_INTERVAL_MIN);
      if (now - lastHeartSpawnRef.current > heartSpawnInterval) {
        const y = pickRandom(RUN_HEART_Y_TIERS);
        if (y === undefined) return;
        heartsRef.current = [...heartsRef.current, { id: nextIdRef.current++, x: RUN_FIELD_WIDTH, y }];
        lastHeartSpawnRef.current = now;
      }

      const charLeft = RUN_CHAR_X;
      const charRight = RUN_CHAR_X + RUN_CHAR_SIZE;
      const charBottom = charYRef.current;
      const charTop = charYRef.current + RUN_CHAR_SIZE;

      let collided = false;
      const nextObstacles: RunObstacle[] = [];
      for (const obs of obstaclesRef.current) {
        const movedX = obs.x - speed;
        const obsLeft = movedX;
        const obsRight = movedX + RUN_OBSTACLE_SIZE;
        const obsTop = RUN_OBSTACLE_SIZE;

        const overlapX =
          obsLeft + RUN_HITBOX_PADDING < charRight - RUN_HITBOX_PADDING &&
          obsRight - RUN_HITBOX_PADDING > charLeft + RUN_HITBOX_PADDING;
        const overlapY = charBottom < obsTop - RUN_HITBOX_PADDING;

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
      const caughtPickups: RunPickup[] = [];
      const nextHearts: RunHeart[] = [];
      for (const heart of heartsRef.current) {
        const movedX = heart.x - speed;
        const heartLeft = movedX;
        const heartRight = movedX + RUN_HEART_SIZE;
        const heartBottom = heart.y;
        const heartTop = heart.y + RUN_HEART_SIZE;

        const overlapX =
          heartLeft < charRight - RUN_HEART_HITBOX_PADDING && heartRight > charLeft + RUN_HEART_HITBOX_PADDING;
        const overlapY =
          heartBottom < charTop - RUN_HEART_HITBOX_PADDING && heartTop > charBottom + RUN_HEART_HITBOX_PADDING;

        if (overlapX && overlapY) {
          caughtThisFrame += 1;
          caughtPickups.push({
            id: nextIdRef.current++,
            x: movedX,
            y: heart.y,
          });
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
        setScorePulseKey((k) => k + 1);
        setPickups((prev) => [...prev, ...caughtPickups]);
        caughtPickups.forEach((p) => {
          setTimeout(() => {
            setPickups((prev) => prev.filter((q) => q.id !== p.id));
          }, RUN_PICKUP_FLOAT_MS);
        });
      }

      setObstacles(obstaclesRef.current);
      setHearts(heartsRef.current);

      if (collided) {
        setIsCrashing(true);
        setTimeout(() => {
          setIsCrashing(false);
          finishGame();
        }, RUN_CRASH_DURATION_MS);
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastFrameRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, countdown, isCrashing, finishGame]);

  const handleFinish = useCallback(() => {
    const reward = Math.min(scoreRef.current, RUN_REWARD_CAP);
    minigameReward({ correctCount: reward });
    closeModal();
  }, [minigameReward, closeModal]);

  const isNewBest = phase === RUN_PHASE.RESULT && score > 0 && score >= bestScore;
  const rewardScore = Math.min(score, RUN_REWARD_CAP);

  return {
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
    releaseJump,
    handleFinish,
  };
}
