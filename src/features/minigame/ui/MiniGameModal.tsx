'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MINIGAME_COIN_PER_CORRECT, MINIGAME_HEART_PER_CORRECT } from '@shared/constants';
import {
  MINIGAME_EMOJIS,
  MINIGAME_DURATION,
  MINIGAME_FIELD_WIDTH,
  MINIGAME_FIELD_HEIGHT,
  MINIGAME_CATCHER_WIDTH,
  MINIGAME_ITEM_SIZE,
  MINIGAME_CATCHER_SPEED,
  MINIGAME_CATCH_EFFECT_MS,
  MINIGAME_SPAWN_INTERVAL_BASE,
  MINIGAME_SPAWN_INTERVAL_MIN,
  MINIGAME_SPAWN_SPEEDUP,
  MINIGAME_ITEM_SPEED_BASE,
  MINIGAME_ITEM_SPEED_RANDOM,
  MINIGAME_ITEM_SPEED_ACCEL,
  MINIGAME_SCORE_GOOD,
  MINIGAME_SCORE_OK,
} from '../constants';
import type { MinigamePhase, FallingItem } from '../types';

type MiniGameModalProps = {
  onComplete: (correctCount: number) => void;
  onClose: () => void;
};

export default function MiniGameModal({ onComplete, onClose }: MiniGameModalProps) {
  const [phase, setPhase] = useState<MinigamePhase>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION);
  const [catcherX, setCatcherX] = useState(MINIGAME_FIELD_WIDTH / 2 - MINIGAME_CATCHER_WIDTH / 2);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [catchEffect, setCatchEffect] = useState<{ x: number; y: number } | null>(null);

  const nextId = useRef(0);
  const gameStart = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const catcherRef = useRef(MINIGAME_FIELD_WIDTH / 2 - MINIGAME_CATCHER_WIDTH / 2);
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const lastSpawn = useRef(0);

  const startGame = useCallback(() => {
    setPhase('playing');
    setScore(0);
    scoreRef.current = 0;
    setItems([]);
    itemsRef.current = [];
    setTimeLeft(MINIGAME_DURATION);
    setCatcherX(MINIGAME_FIELD_WIDTH / 2 - MINIGAME_CATCHER_WIDTH / 2);
    catcherRef.current = MINIGAME_FIELD_WIDTH / 2 - MINIGAME_CATCHER_WIDTH / 2;
    gameStart.current = Date.now();
    nextId.current = 0;
    lastSpawn.current = 0;
  }, []);

  // 키보드 입력
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current.clear();
    };
  }, [phase]);

  // 게임 루프
  useEffect(() => {
    if (phase !== 'playing') return;

    const loop = () => {
      const now = Date.now();
      const elapsed = now - gameStart.current;

      if (elapsed >= MINIGAME_DURATION) {
        setPhase('result');
        setTimeLeft(0);
        setScore(scoreRef.current);
        return;
      }

      setTimeLeft(MINIGAME_DURATION - elapsed);

      // 캐쳐 이동
      if (keysPressed.current.has('ArrowLeft')) {
        catcherRef.current = Math.max(0, catcherRef.current - MINIGAME_CATCHER_SPEED);
      }
      if (keysPressed.current.has('ArrowRight')) {
        catcherRef.current = Math.min(
          MINIGAME_FIELD_WIDTH - MINIGAME_CATCHER_WIDTH,
          catcherRef.current + MINIGAME_CATCHER_SPEED,
        );
      }
      setCatcherX(catcherRef.current);

      // 아이템 스폰 (시간 지날수록 빨라짐)
      const spawnInterval = Math.max(
        MINIGAME_SPAWN_INTERVAL_MIN,
        MINIGAME_SPAWN_INTERVAL_BASE - elapsed * MINIGAME_SPAWN_SPEEDUP,
      );
      if (now - lastSpawn.current > spawnInterval) {
        const newItem: FallingItem = {
          id: nextId.current++,
          x: Math.random() * (MINIGAME_FIELD_WIDTH - MINIGAME_ITEM_SIZE),
          y: -MINIGAME_ITEM_SIZE,
          emoji: MINIGAME_EMOJIS[Math.floor(Math.random() * MINIGAME_EMOJIS.length)],
          speed: MINIGAME_ITEM_SPEED_BASE + Math.random() * MINIGAME_ITEM_SPEED_RANDOM + elapsed * MINIGAME_ITEM_SPEED_ACCEL,
        };
        itemsRef.current = [...itemsRef.current, newItem];
        lastSpawn.current = now;
      }

      // 아이템 이동 + 충돌 체크
      const cx = catcherRef.current;
      const catcherY = MINIGAME_FIELD_HEIGHT - 44;
      let caught = 0;

      const alive = itemsRef.current
        .map((item) => ({ ...item, y: item.y + item.speed }))
        .filter((item) => {
          const isColliding =
            item.y + MINIGAME_ITEM_SIZE >= catcherY &&
            item.y <= catcherY + 36 &&
            item.x + MINIGAME_ITEM_SIZE >= cx &&
            item.x <= cx + MINIGAME_CATCHER_WIDTH;

          if (isColliding) {
            caught++;
            setCatchEffect({ x: item.x, y: item.y });
            setTimeout(() => setCatchEffect(null), MINIGAME_CATCH_EFFECT_MS);
            return false;
          }

          if (item.y > MINIGAME_FIELD_HEIGHT + 10) return false;

          return true;
        });

      if (caught > 0) {
        scoreRef.current += caught;
        setScore(scoreRef.current);
      }

      itemsRef.current = alive;
      setItems(alive);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase]);

  // 모바일 터치 조작
  const handleTouchMove = useCallback((direction: 'left' | 'right') => {
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

  const handleFinish = useCallback(() => {
    onComplete(score);
    onClose();
  }, [score, onComplete, onClose]);

  const progressPercent = (timeLeft / MINIGAME_DURATION) * 100;
  const finalScore = phase === 'result' ? score : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-overlay" />
      <div className="relative w-full max-w-sm modal-content p-5 mx-4 text-center space-y-4 animate-scale-in">

        {phase === 'ready' && (
          <div className="space-y-5 py-4">
            <h3 className="text-lg font-bold text-gray-700">하트 캐치!</h3>
            <div className="text-5xl py-2">💖</div>
            <p className="text-sm text-gray-400 leading-relaxed">
              ← → 키 또는 하단 버튼으로<br />
              떨어지는 하트를 받으세요!
            </p>
            <button
              onClick={startGame}
              className="btn-primary btn-press w-full"
              style={{ backgroundColor: '#FF6B9D' }}
            >
              시작!
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-pink-500">💖 {score}</span>
              <span className="text-xs font-bold text-gray-400 tabular-nums">
                {Math.ceil(timeLeft / 1000)}초
              </span>
            </div>

            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent > 30 ? '#FF6B9D' : '#EF4444',
                }}
              />
            </div>

            {/* 게임 필드 */}
            <div
              className="relative mx-auto rounded-2xl overflow-hidden select-none"
              style={{
                width: MINIGAME_FIELD_WIDTH,
                height: MINIGAME_FIELD_HEIGHT,
                background: 'linear-gradient(180deg, #EDE9FE 0%, #FFF0F5 50%, #FCE7F3 100%)',
              }}
            >
              {/* 떨어지는 아이템 */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="absolute"
                  style={{
                    left: item.x,
                    top: item.y,
                    fontSize: MINIGAME_ITEM_SIZE,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                  }}
                >
                  {item.emoji}
                </div>
              ))}

              {/* 캐치 이펙트 */}
              {catchEffect && (
                <div
                  className="absolute text-xs font-bold text-pink-400 animate-fade-in-up pointer-events-none"
                  style={{ left: catchEffect.x, top: catchEffect.y }}
                >
                  +1
                </div>
              )}

              {/* 캐쳐 (바구니) */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: catcherX,
                  bottom: 8,
                  width: MINIGAME_CATCHER_WIDTH,
                  height: 36,
                  fontSize: 28,
                }}
              >
                🧺
              </div>
            </div>

            {/* 모바일 컨트롤 */}
            <div className="flex justify-center gap-4">
              <button
                onTouchStart={() => handleTouchMove('left')}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchMove('left')}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                className="w-16 h-12 rounded-2xl surface shadow-game-md flex items-center justify-center text-xl btn-press select-none"
              >
                ◀
              </button>
              <button
                onTouchStart={() => handleTouchMove('right')}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchMove('right')}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                className="w-16 h-12 rounded-2xl surface shadow-game-md flex items-center justify-center text-xl btn-press select-none"
              >
                ▶
              </button>
            </div>
          </>
        )}

        {phase === 'result' && (
          <div className="space-y-5 py-4">
            <div className="text-5xl">
              {finalScore >= MINIGAME_SCORE_GOOD ? '🎉' : finalScore >= MINIGAME_SCORE_OK ? '😊' : '😅'}
            </div>
            <h3 className="text-xl font-bold text-gray-700">{finalScore}개 잡았어요!</h3>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-amber-500">🪙 +{finalScore * MINIGAME_COIN_PER_CORRECT}</div>
                <div className="text-[10px] text-gray-400">코인</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-pink-400">💕 +{finalScore * MINIGAME_HEART_PER_CORRECT}</div>
                <div className="text-[10px] text-gray-400">행복도</div>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="btn-primary btn-press w-full"
              style={{ backgroundColor: '#FF6B9D' }}
            >
              받기!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
