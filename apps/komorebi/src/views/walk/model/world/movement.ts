import { hasGroundBetween, isOnGround } from './ground';
import { REGION, type Point, type Region } from './world';

/** Ground outlines define movement; guide routes never restrict where the player can stand. */

export function canWalk(x: number, z: number, region: Region = REGION.village) {
  return (
    Number.isFinite(x) && Number.isFinite(z) && x >= 0 && x <= 100 && z >= 0 && z <= 100 && isOnGround(x, z, region)
  );
}
export type SlideMotion = { direction: Point | null; input: Point | null };
export function createSlideMotion(): SlideMotion {
  return { direction: null, input: null };
}
function slideStep(position: Point, dx: number, dz: number, region: Region, slide?: SlideMotion): Point {
  const length = Math.hypot(dx, dz);
  if (length < 1e-9) return position;
  let best = position;
  let bestScore = -Infinity;
  for (const degrees of [15, 30, 45, 60, 75, 90]) {
    for (const side of [-1, 1]) {
      const angle = (side * degrees * Math.PI) / 180;
      const sx = dx * Math.cos(angle) - dz * Math.sin(angle);
      const sz = dx * Math.sin(angle) + dz * Math.cos(angle);
      const candidate = { x: position.x + sx, z: position.z + sz };
      if (!clearSegment(position, candidate, region)) continue;
      const ahead = { x: position.x + sx / length, z: position.z + sz / length };
      const continuity = slide?.direction ? (sx * slide.direction.x + sz * slide.direction.z) / length : 0;
      if (slide?.direction && continuity < -0.05) continue;
      const score = Math.cos(angle) + (clearSegment(position, ahead, region) ? 0.35 : 0) + continuity * 0.65;
      if (score > bestScore + 1e-6) {
        best = candidate;
        bestScore = score;
      }
    }
  }
  if (slide && best !== position)
    slide.direction = { x: (best.x - position.x) / length, z: (best.z - position.z) / length };
  return best;
}

export function movePlayer(
  position: Point,
  dx: number,
  dz: number,
  region: Region = REGION.village,
  slide?: SlideMotion,
) {
  if (!Number.isFinite(dx) || !Number.isFinite(dz)) return { ...position };
  const distance = Math.hypot(dx, dz);
  if (slide) {
    if (distance < 1e-9) {
      slide.direction = null;
      slide.input = null;
      return { ...position };
    }
    const input = { x: dx / distance, z: dz / distance };
    if (slide.input && input.x * slide.input.x + input.z * slide.input.z < 0.95) slide.direction = null;
    slide.input = input;
  }
  const steps = Math.max(1, Math.ceil(distance / 0.3));
  let next = { ...position };
  for (let i = 0; i < steps; i++) {
    const candidate = { x: next.x + dx / steps, z: next.z + dz / steps };
    const ahead = {
      x: next.x + (dx / Math.max(distance, 1e-9)) * 0.8,
      z: next.z + (dz / Math.max(distance, 1e-9)) * 0.8,
    };
    if (clearSegment(next, candidate, region) && (!slide?.direction || clearSegment(next, ahead, region))) {
      next = candidate;
      if (slide) slide.direction = null;
    } else {
      next = slideStep(next, dx / steps, dz / steps, region, slide);
    }
  }
  return next;
}
export function clearSegment(from: Point, to: Point, region: Region) {
  return canWalk(from.x, from.z, region) && canWalk(to.x, to.z, region) && hasGroundBetween(from, to, region);
}
