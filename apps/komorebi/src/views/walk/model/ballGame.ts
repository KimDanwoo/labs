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

const MAX_FRAME_SECONDS = 0.05;

type PhaseAdvance = (game: BallGame, elapsed: number) => BallGame;

const advanceTimed =
  (limit: number, phase: BallPhase, next: BallPhase): PhaseAdvance =>
  (game, elapsed) => {
    const isDone = elapsed >= limit;
    return { ...game, elapsed: isDone ? 0 : elapsed, phase: isDone ? next : phase };
  };

const advanceIncoming: PhaseAdvance = (game, elapsed) => {
  const isLate = elapsed > BALL_TIMING.deadline;
  return { ...game, elapsed: isLate ? 0 : elapsed, phase: isLate ? BALL_PHASE.missed : BALL_PHASE.incoming };
};

const advanceMissed: PhaseAdvance = (game, elapsed) => ({ ...game, elapsed: Math.min(elapsed, BALL_TIMING.miss) });

const advanceReturning: PhaseAdvance = (game, elapsed) => {
  if (elapsed < BALL_TIMING.returnFlight) return { ...game, elapsed };
  return { ...game, elapsed: 0, phase: game.rallies >= BALL_TIMING.target ? BALL_PHASE.complete : BALL_PHASE.ready };
};

const PHASE_ADVANCE: Record<BallPhase, PhaseAdvance> = {
  [BALL_PHASE.ready]: advanceTimed(BALL_TIMING.ready, BALL_PHASE.ready, BALL_PHASE.incoming),
  [BALL_PHASE.caught]: advanceTimed(BALL_TIMING.hold, BALL_PHASE.caught, BALL_PHASE.returning),
  [BALL_PHASE.missed]: advanceMissed,
  [BALL_PHASE.incoming]: advanceIncoming,
  [BALL_PHASE.returning]: advanceReturning,
  [BALL_PHASE.complete]: (game) => game,
};

const isBallGameFinished = (game: BallGame) =>
  game.phase === BALL_PHASE.complete || (game.phase === BALL_PHASE.missed && game.elapsed >= BALL_TIMING.miss);

export function advanceBallGame(game: BallGame, seconds: number): BallGame {
  if (isBallGameFinished(game)) return game;
  const elapsed = game.elapsed + Math.max(0, Math.min(seconds, MAX_FRAME_SECONDS));
  return PHASE_ADVANCE[game.phase](game, elapsed);
}
