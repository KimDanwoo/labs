import { BALL_PHASE, BALL_ROLE, BALL_TIMING, type BallGame, type BallRole } from './ballGame';

type Flight = { progress: number; arc: number; spin: number };
type Pose = { lean: number; compression: number };
const BALL_ARC = 3.8;
const HAND_HEIGHT = 3.8;

export function ballFlight({ game, isStill }: { game: BallGame; isStill: boolean }): Flight {
  if (game.phase === BALL_PHASE.ready || game.phase === BALL_PHASE.complete) return { progress: 0, arc: 0, spin: 0 };
  if (game.phase === BALL_PHASE.caught) return { progress: 1, arc: 0, spin: 0 };
  if (game.phase === BALL_PHASE.missed) {
    const fall = Math.min(1, game.elapsed / BALL_TIMING.miss);
    const bounce = Math.max(0, Math.sin(fall * Math.PI * 2)) * 0.4;
    return { progress: 1 + fall * 0.24, arc: -HAND_HEIGHT * fall + bounce, spin: isStill ? 0 : fall * 4 };
  }
  const duration = game.phase === BALL_PHASE.returning ? BALL_TIMING.returnFlight : BALL_TIMING.flight;
  const progress = Math.min(1, game.elapsed / duration);
  return {
    progress: game.phase === BALL_PHASE.returning ? 1 - progress : progress,
    arc: isStill ? 0 : Math.sin(progress * Math.PI) * BALL_ARC,
    spin: isStill ? 0 : progress * Math.PI * 2,
  };
}

export function ballPose({ game, role, isStill }: { game: BallGame | null; role: BallRole; isStill: boolean }): Pose {
  if (!game || isStill) return { lean: 0, compression: 1 };
  if (game.phase === BALL_PHASE.ready && role === BALL_ROLE.friend) {
    const windup = Math.sin(Math.min(1, game.elapsed / BALL_TIMING.ready) * Math.PI);
    return { lean: -windup * 0.12, compression: 1 - windup * 0.035 };
  }
  if (game.phase === BALL_PHASE.caught && role === BALL_ROLE.player) {
    const catchWeight = Math.sin(Math.min(1, game.elapsed / BALL_TIMING.hold) * Math.PI);
    return { lean: -catchWeight * 0.06, compression: 1 - catchWeight * 0.08 };
  }
  const isThrowing =
    (game.phase === BALL_PHASE.incoming && role === BALL_ROLE.friend) ||
    (game.phase === BALL_PHASE.returning && role === BALL_ROLE.player);
  if (isThrowing) return { lean: Math.exp(-game.elapsed * 12) * 0.13, compression: 1 };
  return { lean: 0, compression: 1 };
}
