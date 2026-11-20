import { dummy, lerp, maxMotes } from '@views/ride/lib/runner/sprintTrail';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { SPRINT_TRAIL } from '@views/ride/model/runner/constants';
import type { InstancedMesh } from 'three';

const MAX_FRAME_DELTA = 0.05;
const VECTOR_SIZE = 3;
const SPAWN_SPREAD = 1.2;
const SPAWN_HEIGHT_JITTER = 0.4;
const RISE_BASE = 0.5;
const DASH_STRETCH = 8;
const HALF = 0.5;

export interface MoteState {
  position: Float32Array;
  velocity: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  size: Float32Array;
  emitAccumulator: number;
}

export function createMoteState(): MoteState {
  return {
    position: new Float32Array(maxMotes * VECTOR_SIZE),
    velocity: new Float32Array(maxMotes * VECTOR_SIZE),
    life: new Float32Array(maxMotes),
    maxLife: new Float32Array(maxMotes),
    size: new Float32Array(maxMotes),
    emitAccumulator: 0,
  };
}

function spawnMote(s: MoteState, i: number, back: { x: number; z: number }): void {
  const p = i * VECTOR_SIZE;
  const origin = runnerState.position;
  s.position[p] = origin.x + (Math.random() - HALF) * SPAWN_SPREAD;
  s.position[p + 1] = origin.y + SPRINT_TRAIL.spawnHeight + Math.random() * SPAWN_HEIGHT_JITTER;
  s.position[p + 2] = origin.z + (Math.random() - HALF) * SPAWN_SPREAD;
  s.velocity[p] = back.x + (Math.random() - HALF) * SPRINT_TRAIL.jitter;
  s.velocity[p + 1] = SPRINT_TRAIL.rise * (RISE_BASE + Math.random());
  s.velocity[p + 2] = back.z + (Math.random() - HALF) * SPRINT_TRAIL.jitter;
  s.maxLife[i] = lerp(SPRINT_TRAIL.lifeMin, SPRINT_TRAIL.lifeMax, Math.random());
  s.life[i] = s.maxLife[i]!;
  s.size[i] = lerp(SPRINT_TRAIL.sizeMin, SPRINT_TRAIL.sizeMax, Math.random());
}

function advanceMote(s: MoteState, i: number, delta: number): void {
  const p = i * VECTOR_SIZE;
  s.position[p]! += s.velocity[p]! * delta;
  s.position[p + 1]! += s.velocity[p + 1]! * delta;
  s.position[p + 2]! += s.velocity[p + 2]! * delta;
  s.life[i]! -= delta;
}

function drawMote(s: MoteState, mesh: InstancedMesh, i: number): void {
  const p = i * VECTOR_SIZE;
  const t = s.life[i]! > 0 ? s.life[i]! / s.maxLife[i]! : 0;
  dummy.position.set(s.position[p]!, s.position[p + 1]!, s.position[p + 2]!);
  const stretch = 1 + runnerState.dashStrength * DASH_STRETCH;
  dummy.rotation.y = runnerState.heading;
  dummy.scale.set(s.size[i]! * t, s.size[i]! * t, s.size[i]! * t * stretch);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

export function stepSprintTrail(s: MoteState, mesh: InstancedMesh, rawDelta: number): void {
  const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
  const speed = runnerState.speed;
  const isFlying = runnerState.airborneHeight > SPRINT_TRAIL.flyingHeight;
  const isEmitting = isFlying || (runnerState.isSprinting && Math.abs(speed) > SPRINT_TRAIL.minSpeed);
  if (isEmitting) s.emitAccumulator += SPRINT_TRAIL.emitPerSecond * delta;
  const back = {
    x: -Math.sin(runnerState.heading) * speed * SPRINT_TRAIL.backwardCarry,
    z: -Math.cos(runnerState.heading) * speed * SPRINT_TRAIL.backwardCarry,
  };
  for (let i = 0; i < maxMotes; i += 1) {
    const isAlive = s.life[i]! > 0;
    const shouldEmitFinal = !isAlive && s.emitAccumulator >= 1;
    if (shouldEmitFinal) {
      s.emitAccumulator -= 1;
      spawnMote(s, i, back);
    } else if (isAlive) {
      advanceMote(s, i, delta);
    }
    drawMote(s, mesh, i);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
