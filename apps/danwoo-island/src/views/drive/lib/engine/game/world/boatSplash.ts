import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { islandMaterial } from '@views/drive/lib/engine/game/world/islandMaterials';

const DROPS = 600;
const DROP_RADIUS = 0.12;
const LIFETIME = 1.15;
const GRAVITY = 11;
const BURST = { count: 130, ring: [1, 2], outward: [1.2, 4.2], upward: [3.2, 7] } as const;
const WAKE = { perMeter: 16, backward: 0.6, sideways: 2, upward: [1.4, 4.6] } as const;
const FULL_TURN = Math.PI * 2;

type Range = readonly [from: number, to: number];
const between = ([from, to]: Range): number => from + Math.random() * (to - from);

interface Drop {
  readonly origin: THREE.Vector3;
  readonly velocity: THREE.Vector3;
  age: number;
}

export class BoatSplash {
  readonly #mesh: THREE.InstancedMesh;
  readonly #drops: Drop[] = Array.from({ length: DROPS }, () => ({
    origin: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    age: LIFETIME,
  }));
  readonly #matrix = new THREE.Matrix4();
  readonly #position = new THREE.Vector3();
  readonly #rotation = new THREE.Quaternion();
  readonly #scale = new THREE.Vector3();
  #next = 0;
  #owed = 0;

  constructor() {
    this.#mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(DROP_RADIUS, 0), islandMaterial('glass'), DROPS);
    this.#mesh.frustumCulled = false;
    this.#mesh.visible = false;
    this.#mesh.instanceMatrix.array.fill(0);
    getGame().scene.add(this.#mesh);
  }

  #spawn(position: THREE.Vector3): Drop {
    const drop = this.#drops[this.#next] ?? this.#drops[0];
    if (!drop) throw new Error('물방울 풀이 비어 있어요.');
    this.#next = (this.#next + 1) % DROPS;
    drop.age = 0;
    drop.origin.y = getGame().water.surfaceAt(position.x, position.z);
    return drop;
  }

  burst(center: THREE.Vector3): void {
    for (let index = 0; index < BURST.count; index += 1) {
      const { origin, velocity } = this.#spawn(center);
      const angle = (index / BURST.count) * FULL_TURN + Math.random();
      const reach = between(BURST.ring);
      const outward = between(BURST.outward);
      origin.setX(center.x + Math.cos(angle) * reach).setZ(center.z + Math.sin(angle) * reach);
      velocity.set(Math.cos(angle) * outward, between(BURST.upward), Math.sin(angle) * outward);
    }
  }

  trail(stern: THREE.Vector3, backward: THREE.Vector3, travelled: number): void {
    this.#owed += travelled * WAKE.perMeter;
    const speed = travelled / getGame().ticker.deltaScaled;
    while (this.#owed >= 1) {
      this.#owed -= 1;
      const { origin, velocity } = this.#spawn(stern);
      const sideways = (Math.random() - 0.5) * 2 * WAKE.sideways;
      origin.setX(stern.x).setZ(stern.z);
      velocity.set(
        backward.x * speed * WAKE.backward - backward.z * sideways,
        between(WAKE.upward),
        backward.z * speed * WAKE.backward + backward.x * sideways,
      );
    }
  }

  update(): void {
    const delta = getGame().ticker.deltaScaled;
    let hasLive = false;
    for (const [index, drop] of this.#drops.entries()) {
      if (drop.age >= LIFETIME) continue;
      drop.age += delta;
      const { age, origin, velocity } = drop;
      const size = Math.max(0, 1 - age / LIFETIME);
      hasLive = hasLive || size > 0;
      this.#position.copy(origin).addScaledVector(velocity, age);
      this.#position.y -= (GRAVITY * age * age) / 2;
      this.#matrix.compose(this.#position, this.#rotation, this.#scale.setScalar(size));
      this.#mesh.setMatrixAt(index, this.#matrix);
    }
    this.#mesh.instanceMatrix.needsUpdate = true;
    this.#mesh.visible = hasLive;
  }

  dispose(): void {
    this.#mesh.geometry.dispose();
    this.#mesh.removeFromParent();
  }
}
