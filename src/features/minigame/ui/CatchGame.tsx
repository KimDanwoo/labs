'use client';

import {
  MINIGAME_CATCHER_BOTTOM,
  MINIGAME_CATCHER_EMOJI_SIZE,
  MINIGAME_CATCHER_HEIGHT,
  MINIGAME_CATCHER_WIDTH,
  MINIGAME_COMBO_SHOW_THRESHOLD,
  MINIGAME_FIELD_HEIGHT,
  MINIGAME_FIELD_WIDTH,
  MINIGAME_ITEM_SIZE,
  MINIGAME_PHASE,
  MINIGAME_SCORE_GOOD,
  MINIGAME_SCORE_OK,
} from '../model/constants';
import { useCatchEngine } from '../model/hooks';
import MinigameCooldownNotice from './MinigameCooldownNotice';
import MinigameRewardSummary from './MinigameRewardSummary';

type CatchGameProps = {
  onExitToMenu: () => void;
};

export default function CatchGame({ onExitToMenu }: CatchGameProps) {
  const {
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
    finalScore,
    startGame,
    handleTouchMove,
    handleTouchEnd,
    handleFinish,
  } = useCatchEngine();

  if (phase === MINIGAME_PHASE.READY) {
    return (
      <div className="space-y-5 py-4">
        <h3 className="text-lg font-bold text-gray-700">하트 캐치!</h3>
        <div className="text-5xl py-2">💖</div>
        <p className="text-sm text-gray-400 leading-relaxed">
          ← → 키 또는 하단 버튼으로
          <br />
          💖 하트를 받고 💣 폭탄은 피하세요!
        </p>
        {!minigame.canPlay && (
          <MinigameCooldownNotice remainingMs={minigame.cooldownRemainingMs} />
        )}
        <button
          onClick={startGame}
          disabled={!minigame.canPlay}
          className="btn-primary btn-press w-full disabled:opacity-40"
          style={{ backgroundColor: '#FF6B9D' }}
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

  if (phase === MINIGAME_PHASE.PLAYING) {
    return (
      <>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-pink-500">💖 {score}</span>
          {combo >= MINIGAME_COMBO_SHOW_THRESHOLD && (
            <span
              key={combo}
              className="text-xs font-black text-rose-500 catch-combo-pop"
            >
              🔥 {combo} 콤보
            </span>
          )}
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

        <div
          className="relative mx-auto rounded-2xl overflow-hidden select-none"
          style={{
            width: MINIGAME_FIELD_WIDTH,
            height: MINIGAME_FIELD_HEIGHT,
            background:
              'linear-gradient(180deg, #EDE9FE 0%, #FFF0F5 50%, #FCE7F3 100%)',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: item.x,
                top: item.y,
                fontSize: MINIGAME_ITEM_SIZE,
                lineHeight: 1,
                filter:
                  item.kind === 'bad'
                    ? 'drop-shadow(0 2px 4px rgba(239,68,68,0.35))'
                    : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
              }}
            >
              {item.emoji}
            </div>
          ))}

          {floats.map((float) => (
            <div
              key={float.id}
              className={`absolute pointer-events-none ${
                float.variant === 'bad'
                  ? 'catch-float catch-float-bad'
                  : 'catch-float catch-float-good'
              }`}
              style={{ left: float.x, top: float.y }}
            >
              {float.text}
            </div>
          ))}

          {badFlashKey > 0 && (
            <div
              key={badFlashKey}
              className="absolute inset-0 pointer-events-none bg-red-400/40 catch-bad-flash"
            />
          )}

          <div
            className="absolute flex items-center justify-center"
            style={{
              left: catcherX,
              bottom: MINIGAME_CATCHER_BOTTOM,
              width: MINIGAME_CATCHER_WIDTH,
              height: MINIGAME_CATCHER_HEIGHT,
              fontSize: MINIGAME_CATCHER_EMOJI_SIZE,
            }}
          >
            🧺
          </div>
        </div>

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
    );
  }

  if (phase === MINIGAME_PHASE.RESULT) {
    return (
      <div className="space-y-5 py-4">
        <div className="text-5xl">
          {finalScore >= MINIGAME_SCORE_GOOD
            ? '🎉'
            : finalScore >= MINIGAME_SCORE_OK
              ? '😊'
              : '😅'}
        </div>
        <h3 className="text-xl font-bold text-gray-700">
          {finalScore}개 잡았어요!
        </h3>
        <MinigameRewardSummary score={finalScore} />
        <button
          onClick={handleFinish}
          className="btn-primary btn-press w-full"
          style={{ backgroundColor: '#FF6B9D' }}
        >
          받기!
        </button>
      </div>
    );
  }

  return null;
}
