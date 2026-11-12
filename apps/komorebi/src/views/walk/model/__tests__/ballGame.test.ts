import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceBallGame,
  BALL_PHASE,
  BALL_TIMING,
  canReturnBall,
  createBallGame,
  returnBall,
  type BallGame,
} from '../ballGame';

function advance(game: BallGame, seconds: number): BallGame {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.01) game = advanceBallGame(game, 0.01);
  return game;
}

test('early input cannot return a distant ball, and five timely catches finish only after the final return', () => {
  let game = createBallGame();
  assert.equal(returnBall(game), game);
  for (let rally = 1; rally <= BALL_TIMING.target; rally++) {
    game = advance(game, BALL_TIMING.ready + 0.02);
    assert.equal(game.phase, BALL_PHASE.incoming);
    game = advance(game, BALL_TIMING.flight);
    assert.ok(canReturnBall(game));
    game = returnBall(game);
    assert.equal(game.rallies, rally);
    assert.equal(game.phase, BALL_PHASE.caught);
    assert.equal(returnBall(game), game, 'repeated input cannot count a second catch');
    game = advance(game, BALL_TIMING.hold + 0.02);
    assert.equal(game.phase, BALL_PHASE.returning);
    game = advance(game, BALL_TIMING.returnFlight + 0.01);
  }
  assert.equal(game.phase, BALL_PHASE.complete);
  assert.equal(advance(game, 10), game);
});

test('a missed ball waits for an explicit retry and negative or stalled clocks cannot skip a rally', () => {
  const start = createBallGame();
  assert.deepEqual(advanceBallGame(start, -1), start);
  assert.equal(advanceBallGame(start, 500).elapsed, 0.05);
  const missed = advance(start, BALL_TIMING.ready + BALL_TIMING.deadline + BALL_TIMING.miss + 0.1);
  assert.equal(missed.phase, BALL_PHASE.missed);
  assert.equal(returnBall(missed), missed);
  assert.equal(advance(missed, 10), missed);
  assert.deepEqual(createBallGame(), start);
});

test('both edges of the visible catch window are accepted', () => {
  for (const elapsed of [BALL_TIMING.catchFrom, BALL_TIMING.deadline]) {
    assert.equal(returnBall({ ...createBallGame(), phase: BALL_PHASE.incoming, elapsed }).rallies, 1);
  }
  assert.equal(
    canReturnBall({ ...createBallGame(), phase: BALL_PHASE.incoming, elapsed: BALL_TIMING.catchFrom - 0.001 }),
    false,
  );
  assert.equal(
    canReturnBall({ ...createBallGame(), phase: BALL_PHASE.incoming, elapsed: BALL_TIMING.deadline + 0.001 }),
    false,
  );
});

test('waiting for both players to get into position does not consume the throw or catch window', () => {
  const ready = createBallGame();
  for (let frame = 0; frame < 300; frame++) assert.deepEqual(advanceBallGame(ready, 0), ready);
  const throwStart = advance(ready, BALL_TIMING.ready + 0.02);
  assert.equal(throwStart.phase, BALL_PHASE.incoming);
  assert.ok(throwStart.elapsed < 0.05);
});
