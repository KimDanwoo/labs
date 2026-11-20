import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { Shape, ShapeGeometry, Vector3, type Color, type InstancedMesh, type Object3D, type Quaternion } from 'three';

export const COUNT = 180;

export const COLORS = ['#ffe09b', '#fff3d4', '#bceaff', '#e4c9ff'];

const STAR_POINTS = 8;
const STAR_INNER_RADIUS = 0.24;
const SPAWN_RATE = 160;
const LIFETIME = 1.2;
const MAX_FRAME_DELTA = 0.05;
const IDLE_SPIN_ANGLE = Math.PI * 0.1;
const ORBIT_BASE = 1.3;
const ORBIT_JITTER = 0.6;
const SPAWN_HEIGHT = 1.3;
const SIDE_VELOCITY = 0.7;
const LIFT_GAIN = 0.6;
const LIFT_BASE = 0.4;
const DASH_PUSH = 5;
const SIZE_BASE = 0.06;
const SIZE_JITTER = 0.1;
const TWIST_GAIN = 2;

export interface Particle {
  position: Vector3;
  velocity: Vector3;
  life: number;
  size: number;
  rotation: number;
}

export interface StardustState {
  particles: Particle[];
  accumulator: number;
  cursor: number;
}

export function makeStarGeometry(): ShapeGeometry {
  const shape = new Shape();
  for (let i = 0; i < STAR_POINTS; i += 1) {
    const angle = (i * Math.PI) / (STAR_POINTS / 2);
    const radius = i % 2 === 0 ? 1 : STAR_INNER_RADIUS;
    const x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new ShapeGeometry(shape);
}

export function createStardustState(): StardustState {
  const particles = Array.from({ length: COUNT }, () => ({
    position: new Vector3(),
    velocity: new Vector3(),
    life: 0,
    size: 0,
    rotation: 0,
  }));
  return { particles, accumulator: 0, cursor: 0 };
}

function emitParticle(particle: Particle, index: number): void {
  const { heading, position, isSpinning, spinAngle, dashStrength } = runnerState;
  const angle = (isSpinning ? spinAngle : IDLE_SPIN_ANGLE) + (index % 2) * Math.PI;
  const radius = ORBIT_BASE + Math.random() * ORBIT_JITTER;
  const side = Math.cos(angle) * radius;
  particle.position.set(
    position.x + Math.cos(heading) * side,
    position.y + SPAWN_HEIGHT + Math.sin(angle) * radius,
    position.z - Math.sin(heading) * side,
  );
  particle.velocity.set(
    Math.cos(heading) * side * SIDE_VELOCITY,
    Math.sin(angle) * LIFT_GAIN + LIFT_BASE,
    -Math.sin(heading) * side * SIDE_VELOCITY,
  );
  if (dashStrength > 0) {
    particle.velocity.x -= Math.sin(heading) * DASH_PUSH * dashStrength;
    particle.velocity.z -= Math.cos(heading) * DASH_PUSH * dashStrength;
  }
  particle.life = 1;
  particle.size = SIZE_BASE + Math.random() * SIZE_JITTER;
  particle.rotation = Math.random() * Math.PI;
}

export function stepStardust(
  s: StardustState,
  mesh: InstancedMesh,
  dummy: Object3D,
  colors: Color[],
  cameraQuaternion: Quaternion,
  rawDelta: number,
): void {
  const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
  s.accumulator = runnerState.isSpinning || runnerState.dashStrength > 0 ? s.accumulator + delta * SPAWN_RATE : 0;
  while (s.accumulator >= 1) {
    s.accumulator -= 1;
    const index = s.cursor++ % COUNT;
    emitParticle(s.particles[index]!, index);
  }
  for (let i = 0; i < COUNT; i += 1) {
    const particle = s.particles[i]!;
    particle.life = Math.max(0, particle.life - delta / LIFETIME);
    particle.position.addScaledVector(particle.velocity, delta);
    dummy.position.copy(particle.position);
    dummy.quaternion.copy(cameraQuaternion);
    dummy.rotateZ(particle.rotation + (1 - particle.life) * TWIST_GAIN);
    dummy.scale.setScalar(particle.size * Math.sin(particle.life * Math.PI));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, colors[i % colors.length]!);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
