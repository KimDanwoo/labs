import { alea } from 'seedrandom';
import { attribute, Fn, mix, positionGeometry, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

const LINES = 30;
const VERTICES_PER_LINE = 3;
const SPEED = 12;
const RENDER_ORDER = 10;
const SMOOTHING = 2;
const MAX_DISTANCE = Math.hypot(1, 1);
const THICKNESS = { min: 0.002, range: 0.01 } as const;
const REACH = { min: 0.4, range: 0.4 } as const;
const TIPNESS = [0, 1, 0] as const;

interface LineBuffers {
  positions: number[];
  timeRandomness: number[];
  distances: number[];
  tipness: number[];
}

function lineBuffers(): LineBuffers {
  const random = alea('speedLines');
  const origin = new THREE.Vector2();
  const buffers: LineBuffers = { positions: [], timeRandomness: [], distances: [], tipness: [] };
  for (let line = 0; line < LINES; line += 1) {
    const middle = new THREE.Vector2(0, 1).rotateAround(origin, Math.PI * 2 * random());
    const thickness = random() * THICKNESS.range + THICKNESS.min;
    const left = middle.clone().rotateAround(origin, thickness);
    const right = middle.clone().rotateAround(origin, -thickness);
    for (const vertex of [left, middle, right]) {
      vertex.multiplyScalar(MAX_DISTANCE);
      buffers.positions.push(vertex.x, vertex.y, 0);
    }
    const reach = random() * REACH.range + REACH.min;
    buffers.timeRandomness.push(line, line, line);
    buffers.distances.push(reach, reach, reach);
    buffers.tipness.push(...TIPNESS);
  }
  return buffers;
}

function linesGeometry(): THREE.BufferGeometry {
  const { positions, timeRandomness, distances, tipness } = lineBuffers();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, VERTICES_PER_LINE));
  geometry.setAttribute('timeRandomness', new THREE.Float32BufferAttribute(timeRandomness, 1));
  geometry.setAttribute('distance', new THREE.Float32BufferAttribute(distances, 1));
  geometry.setAttribute('tipness', new THREE.Float32BufferAttribute(tipness, 1));
  return geometry;
}

export class SpeedLines {
  strength = 0;
  readonly worldTarget = new THREE.Vector3();
  readonly mesh: THREE.Mesh;
  readonly #smoothedStrength = uniform(0);
  readonly #clipSpaceTarget = uniform(new THREE.Vector3());
  readonly #speed = uniform(SPEED);

  constructor(elapsedScaled: THREE.UniformNode<'float', number>) {
    const material = new THREE.MeshBasicNodeMaterial({ depthWrite: false, depthTest: false });
    material.vertexNode = Fn(() => {
      const oscillation = elapsedScaled
        .mul(this.#speed)
        .add(attribute('timeRandomness', 'float'))
        .sin()
        .div(2)
        .add(0.5);
      const pull = attribute('tipness', 'float')
        .mul(oscillation)
        .mul(attribute('distance', 'float'))
        .mul(this.#smoothedStrength);
      return vec4(mix(positionGeometry.xy, this.#clipSpaceTarget.xy, pull), 0, 1);
    })();
    material.outputNode = vec4(1);
    this.mesh = new THREE.Mesh(linesGeometry(), material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = RENDER_ORDER;
  }

  update(camera: THREE.Camera, delta: number): void {
    this.#clipSpaceTarget.value.copy(this.worldTarget).project(camera);
    const smoothed = this.#smoothedStrength.value;
    this.#smoothedStrength.value = smoothed + (this.strength - smoothed) * delta * SMOOTHING;
  }
}
