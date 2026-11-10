import * as THREE from 'three';

const COUNT = 45;
const AXES = 3;
/** Flecks drift right across the painting and re-enter from the left edge. */
const EDGE_X = 60;
const HALF_HEIGHT = 35;
const NEAREST_DEPTH = 4;
const DEPTH_RANGE = 20;
const SEED = 52;

const INDOOR_OPACITY = 0.28;
const OUTDOOR_OPACITY = 0.45;

/** The same flecks every visit, spread over the painting at several depths. */
export function createDustPositions(): Float32Array {
  let seed = SEED;
  const random = () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
  const positions = new Float32Array(COUNT * AXES);
  for (let i = 0; i < COUNT; i++) {
    positions[i * AXES] = random() * EDGE_X * 2 - EDGE_X;
    positions[i * AXES + 1] = random() * HALF_HEIGHT * 2 - HALF_HEIGHT;
    positions[i * AXES + 2] = NEAREST_DEPTH + random() * DEPTH_RANGE;
  }
  return positions;
}

/** Each fleck drifts right at its own pace while bobbing; one that leaves the right edge re-enters on the left. */
export function driftDustPositions(positions: Float32Array, dt: number, elapsed: number): void {
  for (let i = 0; i < COUNT; i++) {
    positions[i * AXES] = positions[i * AXES]! + dt * (0.15 + i * 0.002);
    positions[i * AXES + 1] = positions[i * AXES + 1]! + Math.sin(elapsed * 0.4 + i) * dt * 0.06;
    if (positions[i * AXES]! > EDGE_X) positions[i * AXES] = -EDGE_X;
  }
}

type DustFrame = {
  dt: number;
  elapsed: number;
  isIndoors: boolean;
  darkness: number;
  wetness: number;
  isStill: boolean;
};

/** Screen-space flecks float at several actual Z depths, providing gentle parallax. They fade at night and in rain. */
export function createDust(scene: THREE.Scene) {
  const positions = createDustPositions();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, AXES));
  const material = new THREE.PointsMaterial({
    color: '#fff6c5',
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
  });
  const cloud = new THREE.Points(geometry, material);
  cloud.renderOrder = 5;
  scene.add(cloud);

  return {
    update({ dt, elapsed, isIndoors, darkness, wetness, isStill }: DustFrame) {
      material.opacity = (isIndoors ? INDOOR_OPACITY : OUTDOOR_OPACITY) * (1 - darkness * 0.85) * (1 - wetness * 0.8);
      if (isStill) return;
      driftDustPositions(positions, dt, elapsed);
      geometry.attributes.position!.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
