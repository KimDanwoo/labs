export const BALL_PHASE = {
  ready: 'ready',
  incoming: 'incoming',
  caught: 'caught',
  returning: 'returning',
  missed: 'missed',
  complete: 'complete',
} as const;
export type BallPhase = (typeof BALL_PHASE)[keyof typeof BALL_PHASE];
export const BALL_ROLE = { player: 'player', friend: 'friend' } as const;
export type BallRole = (typeof BALL_ROLE)[keyof typeof BALL_ROLE];
export const BALL_TIMING = {
  ready: 0.85,
  flight: 1.3,
  catchFrom: 1.1,
  deadline: 1.9,
  hold: 0.4,
  returnFlight: 1.1,
  miss: 0.75,
  target: 5,
} as const;
export type BallGame = { phase: BallPhase; elapsed: number; rallies: number };

export function createBallGame(): BallGame {
  return { phase: BALL_PHASE.ready, elapsed: 0, rallies: 0 };
}

export function canReturnBall(game: BallGame): boolean {
  return (
    game.phase === BALL_PHASE.incoming && game.elapsed >= BALL_TIMING.catchFrom && game.elapsed <= BALL_TIMING.deadline
  );
}

export function returnBall(game: BallGame): BallGame {
  if (!canReturnBall(game)) return game;
  return { phase: BALL_PHASE.caught, elapsed: 0, rallies: game.rallies + 1 };
}

export function advanceBallGame(game: BallGame, seconds: number): BallGame {
  if (game.phase === BALL_PHASE.complete || (game.phase === BALL_PHASE.missed && game.elapsed >= BALL_TIMING.miss))
    return game;
  const elapsed = game.elapsed + Math.max(0, Math.min(seconds, 0.05));
  if (game.phase === BALL_PHASE.ready) {
    return {
      ...game,
      elapsed: elapsed < BALL_TIMING.ready ? elapsed : 0,
      phase: elapsed < BALL_TIMING.ready ? BALL_PHASE.ready : BALL_PHASE.incoming,
    };
  }
  if (game.phase === BALL_PHASE.caught) {
    return {
      ...game,
      elapsed: elapsed < BALL_TIMING.hold ? elapsed : 0,
      phase: elapsed < BALL_TIMING.hold ? BALL_PHASE.caught : BALL_PHASE.returning,
    };
  }
  if (game.phase === BALL_PHASE.missed) return { ...game, elapsed: Math.min(elapsed, BALL_TIMING.miss) };
  if (game.phase === BALL_PHASE.incoming) {
    return {
      ...game,
      elapsed: elapsed > BALL_TIMING.deadline ? 0 : elapsed,
      phase: elapsed > BALL_TIMING.deadline ? BALL_PHASE.missed : BALL_PHASE.incoming,
    };
  }
  if (elapsed < BALL_TIMING.returnFlight) return { ...game, elapsed };
  return { ...game, elapsed: 0, phase: game.rallies >= BALL_TIMING.target ? BALL_PHASE.complete : BALL_PHASE.ready };
}
