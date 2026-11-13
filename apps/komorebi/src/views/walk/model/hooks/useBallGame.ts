import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { advanceBallGame, BALL_PHASE, createBallGame, returnBall, type BallGame } from '../ballGame';

type Options = { onFrame: (frame: BallGame | null) => boolean };
type GameControls = { game: BallGame; handleReturn: () => void; handleRetry: () => void };

export function useBallGame({ onFrame }: Options): GameControls {
  const current = useRef(createBallGame());
  const [game, setGame] = useState(createBallGame);
  const sendFrame = useEffectEvent(onFrame);
  useEffect(() => {
    let animation = 0;
    let previous = 0;
    let published = 0;
    let isPositioned = false;
    function tick(now: number) {
      const canAdvance = isPositioned || current.current.phase !== BALL_PHASE.ready;
      const dt = previous && !document.hidden && canAdvance ? (now - previous) / 1000 : 0;
      previous = now;
      const before = current.current;
      current.current = advanceBallGame(before, dt);
      isPositioned = sendFrame(current.current);
      if (now - published > 80 || before.phase !== current.current.phase) {
        setGame(current.current);
        published = now;
      }
      animation = requestAnimationFrame(tick);
    }
    const resetClock = () => {
      previous = 0;
    };
    document.addEventListener('visibilitychange', resetClock);
    animation = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animation);
      document.removeEventListener('visibilitychange', resetClock);
      sendFrame(null);
    };
  }, []);
  function publish(next: BallGame) {
    current.current = next;
    setGame(next);
    onFrame(next);
  }
  return {
    game,
    handleReturn: () => publish(returnBall(current.current)),
    handleRetry: () => publish(createBallGame()),
  };
}
