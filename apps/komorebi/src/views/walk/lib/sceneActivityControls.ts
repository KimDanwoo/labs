import { WEATHER } from '../config/walk';
import { BALL_PHASE, type BallGame } from '../model/ballGame';
import { schoolmateGreetingPosition, schoolmatePlayPosition } from '../model/schoolmates';
import { isNearSpot } from '../model/world/interactions';
import { findRoute } from '../model/world/routing';
import { REGION } from '../model/world/world';
import { type SceneContext, type WalkEngine } from './sceneContext';

export function createActivityControls({
  container,
  state,
  wake,
  parts,
}: SceneContext): Pick<
  WalkEngine,
  'reactToCompanion' | 'greetSchoolmate' | 'endSchoolmateGreeting' | 'setBallGame' | 'setFishing' | 'finishSleep'
> {
  const { character, companions, bedRest, schoolmates, jump, keys } = parts;
  const isBallBlocked = () => !state.greetingId || state.region !== REGION.school || state.weather === WEATHER.rain;
  const greetedFriend = () => schoolmates.standing.find((friend) => friend.id === state.greetingId);
  const approachPlaySpot = () => {
    const friend = greetedFriend();
    const spot = friend ? schoolmatePlayPosition({ player: state.position, friend }) : null;
    if (!spot) return false;
    state.route = findRoute(state.position, spot, state.region);
    state.destination = null;
    jump.height = 0;
    jump.velocity = 0;
    return true;
  };
  const applyBallFrame = (frame: BallGame | null) => {
    const hasPhaseChanged = frame?.phase !== state.ballFrame?.phase;
    if (frame?.phase === BALL_PHASE.returning && state.ballFrame?.phase !== BALL_PHASE.returning)
      state.companionAge = 0;
    state.ballFrame = frame;
    schoolmates.setBallGame(frame);
    if (hasPhaseChanged) wake();
  };
  const faceGreeting = () => {
    if (!state.greetingId) return;
    const friend = greetedFriend();
    if (friend) state.heading = Math.atan2(friend.x - state.position.x, friend.z - state.position.z);
  };
  return {
    reactToCompanion(reaction) {
      state.companionAge = 0;
      companions.react(reaction);
      wake();
    },
    greetSchoolmate(id) {
      const friend = schoolmates.greet(id, state.position);
      if (!friend) return false;
      const standing = schoolmateGreetingPosition({ player: state.position, friend, region: state.region });
      if (!standing) {
        schoolmates.endGreeting();
        return false;
      }
      state.position = standing;
      state.greetingId = id;
      state.route = [];
      state.destination = null;
      keys.clear();
      state.moveSpeed = 0;
      state.heading = Math.atan2(friend.x - state.position.x, friend.z - state.position.z);
      wake();
      return true;
    },
    endSchoolmateGreeting() {
      schoolmates.endGreeting();
      state.greetingId = null;
      state.ballFrame = null;
      state.route = [];
      state.moveSpeed = 0;
      wake();
    },
    setBallGame(frame) {
      if (frame && isBallBlocked()) return false;
      if (frame && !state.ballFrame && !approachPlaySpot()) return false;
      if (frame === state.ballFrame) return state.route.length === 0;
      applyBallFrame(frame);
      if (state.route.length === 0) faceGreeting();
      return state.route.length === 0;
    },
    setFishing(frame) {
      if (frame && !state.fishingFrame) {
        if (!isNearSpot('pier', state.position, state.region)) return;
        state.route = [];
        state.destination = null;
        keys.clear();
        state.heading = Math.PI / 2;
        state.moveSpeed = 0;
        jump.height = 0;
        jump.velocity = 0;
      }
      if (frame?.phase !== state.fishingFrame?.phase) state.fishingAge = 0;
      state.fishingFrame = frame;
      container.dataset.fishing = frame?.phase ?? 'none';
      wake();
    },
    finishSleep() {
      state.sleeping = false;
      bedRest.finish();
      character.setOpacity(1);
      wake();
    },
  };
}
