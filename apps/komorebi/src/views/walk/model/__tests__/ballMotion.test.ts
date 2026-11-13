import assert from 'node:assert/strict';
import test from 'node:test';
import { BALL_PHASE, BALL_ROLE, BALL_TIMING, createBallGame } from '../ballGame';
import { ballFlight, ballPose } from '../ballMotion';

test('the ball stays with the thrower during windup, reaches both hands and rises over the ground in flight', () => {
  const ready = createBallGame();
  assert.equal(ballFlight({ game: ready, isStill: false }).progress, 0);
  const incoming = { ...ready, phase: BALL_PHASE.incoming, elapsed: BALL_TIMING.flight / 2 };
  const middle = ballFlight({ game: incoming, isStill: false });
  assert.equal(middle.progress, 0.5);
  assert.ok(middle.arc > 3);
  assert.equal(ballFlight({ game: { ...incoming, elapsed: BALL_TIMING.flight }, isStill: false }).progress, 1);
  assert.equal(ballFlight({ game: { ...incoming, phase: BALL_PHASE.caught }, isStill: false }).progress, 1);
  assert.equal(
    ballFlight({
      game: { ...incoming, phase: BALL_PHASE.returning, elapsed: BALL_TIMING.returnFlight },
      isStill: false,
    }).progress,
    0,
  );
});

test('missing carries the ball past the receiver down to the ground instead of holding it at chest height', () => {
  const motion = ballFlight({
    game: { ...createBallGame(), phase: BALL_PHASE.missed, elapsed: BALL_TIMING.miss },
    isStill: false,
  });
  assert.ok(motion.progress > 1);
  assert.ok(motion.arc < -3);
});

test('throwing and catching move the corresponding character, with no extra motion under reduced motion', () => {
  const game = { ...createBallGame(), phase: BALL_PHASE.caught, elapsed: BALL_TIMING.hold / 2 };
  assert.ok(ballPose({ game, role: BALL_ROLE.player, isStill: false }).compression < 0.95);
  assert.deepEqual(ballPose({ game, role: BALL_ROLE.friend, isStill: false }), { lean: 0, compression: 1 });
  assert.deepEqual(ballPose({ game, role: BALL_ROLE.player, isStill: true }), { lean: 0, compression: 1 });
  assert.equal(ballFlight({ game: { ...game, phase: BALL_PHASE.incoming }, isStill: true }).arc, 0);
});
