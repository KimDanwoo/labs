import { hasGroundBetween, isOnGround } from '@views/walk/model/world/ground';
import { REGION, type Point, type Region } from '@views/walk/model/world/world';

export function canWalk(x: number, z: number, region: Region = REGION.village) {
  return (
    Number.isFinite(x) && Number.isFinite(z) && x >= 0 && x <= 100 && z >= 0 && z <= 100 && isOnGround(x, z, region)
  );
}
export type SlideMotion = { direction: Point | null; input: Point | null };
export function createSlideMotion(): SlideMotion {
  return { direction: null, input: null };
}
const SLIDE_DEGREES = [15, 30, 45, 60, 75, 90];
const SLIDE_MIN_LENGTH = 1e-9;
const SLIDE_REVERSAL_LIMIT = -0.05;
const SLIDE_FORWARD_BONUS = 0.35;
const SLIDE_CONTINUITY_WEIGHT = 0.65;
const SLIDE_SCORE_MARGIN = 1e-6;
const INPUT_TURN_LIMIT = 0.95;
const LOOKAHEAD_DISTANCE = 0.8;
const MAX_SUBSTEP = 0.3;

interface SlideCandidate {
  point: Point;
  score: number;
}

function slideContinuity(sx: number, sz: number, length: number, slide?: SlideMotion) {
  return slide?.direction ? (sx * slide.direction.x + sz * slide.direction.z) / length : 0;
}

function slideCandidate(
  position: Point,
  dx: number,
  dz: number,
  angle: number,
  region: Region,
  slide?: SlideMotion,
): SlideCandidate | null {
  const length = Math.hypot(dx, dz);
  const sx = dx * Math.cos(angle) - dz * Math.sin(angle);
  const sz = dx * Math.sin(angle) + dz * Math.cos(angle);
  const point = { x: position.x + sx, z: position.z + sz };
  if (!clearSegment(position, point, region)) return null;
  const ahead = { x: position.x + sx / length, z: position.z + sz / length };
  const continuity = slideContinuity(sx, sz, length, slide);
  const isReversingSlide = slide?.direction && continuity < SLIDE_REVERSAL_LIMIT;
  if (isReversingSlide) return null;
  const forwardBonus = clearSegment(position, ahead, region) ? SLIDE_FORWARD_BONUS : 0;
  return { point, score: Math.cos(angle) + forwardBonus + continuity * SLIDE_CONTINUITY_WEIGHT };
}

function slideStep(position: Point, dx: number, dz: number, region: Region, slide?: SlideMotion): Point {
  const length = Math.hypot(dx, dz);
  if (length < SLIDE_MIN_LENGTH) return position;
  let best = position;
  let bestScore = -Infinity;
  for (const degrees of SLIDE_DEGREES) {
    for (const side of [-1, 1]) {
      const candidate = slideCandidate(position, dx, dz, (side * degrees * Math.PI) / 180, region, slide);
      if (!candidate) continue;
      if (!(candidate.score > bestScore + SLIDE_SCORE_MARGIN)) continue;
      best = candidate.point;
      bestScore = candidate.score;
    }
  }
  const hasSlidAway = slide && best !== position;
  if (hasSlidAway) slide.direction = { x: (best.x - position.x) / length, z: (best.z - position.z) / length };
  return best;
}

function trackSlideInput(slide: SlideMotion, dx: number, dz: number, distance: number) {
  if (distance < SLIDE_MIN_LENGTH) {
    slide.direction = null;
    slide.input = null;
    return false;
  }
  const input = { x: dx / distance, z: dz / distance };
  const isTurningAway = slide.input && input.x * slide.input.x + input.z * slide.input.z < INPUT_TURN_LIMIT;
  if (isTurningAway) slide.direction = null;
  slide.input = input;
  return true;
}

function advanceSubstep(
  from: Point,
  delta: Point,
  distance: number,
  steps: number,
  region: Region,
  slide?: SlideMotion,
): Point {
  const candidate = { x: from.x + delta.x / steps, z: from.z + delta.z / steps };
  const reach = Math.max(distance, SLIDE_MIN_LENGTH);
  const ahead = {
    x: from.x + (delta.x / reach) * LOOKAHEAD_DISTANCE,
    z: from.z + (delta.z / reach) * LOOKAHEAD_DISTANCE,
  };
  const isOpen = clearSegment(from, candidate, region) && (!slide?.direction || clearSegment(from, ahead, region));
  if (!isOpen) return slideStep(from, delta.x / steps, delta.z / steps, region, slide);
  if (slide) slide.direction = null;
  return candidate;
}

export function movePlayer(
  position: Point,
  dx: number,
  dz: number,
  region: Region = REGION.village,
  slide?: SlideMotion,
) {
  if (!Number.isFinite(dx)) return { ...position };
  if (!Number.isFinite(dz)) return { ...position };
  const distance = Math.hypot(dx, dz);
  const isSlideRejected = slide && !trackSlideInput(slide, dx, dz, distance);
  if (isSlideRejected) return { ...position };
  const steps = Math.max(1, Math.ceil(distance / MAX_SUBSTEP));
  let next = { ...position };
  for (let i = 0; i < steps; i++) next = advanceSubstep(next, { x: dx, z: dz }, distance, steps, region, slide);
  return next;
}
export function clearSegment(from: Point, to: Point, region: Region) {
  return canWalk(from.x, from.z, region) && canWalk(to.x, to.z, region) && hasGroundBetween(from, to, region);
}
