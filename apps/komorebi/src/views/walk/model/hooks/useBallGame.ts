import { MS_PER_SECOND } from '@views/walk/config/time';
import { advanceBallGame, BALL_PHASE, createBallGame, returnBall, type BallGame } from '@views/walk/model/ballGame';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

const PUBLISH_INTERVAL_MS = 80;

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
      const canTick = previous && !document.hidden && canAdvance;
      const dt = canTick ? (now - previous) / MS_PER_SECOND : 0;
      previous = now;
      const before = current.current;
      current.current = advanceBallGame(before, dt);
      isPositioned = sendFrame(current.current);
      const shouldPublish = now - published > PUBLISH_INTERVAL_MS || before.phase !== current.current.phase;
      if (shouldPublish) {
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
