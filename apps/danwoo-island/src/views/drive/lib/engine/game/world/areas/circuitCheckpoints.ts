import * as THREE from 'three/webgpu';

import { segmentCircleIntersection } from '../../utilities/maths';
import type { Area } from './area';
import { type Checkpoint, CHECKPOINT, type CircuitSounds, createCheckpoint, DOOR } from './circuitConfig';
import { createDoor, placeDoor } from './circuitSetup';

export class CircuitCheckpoints {
  readonly #area: Area;
  readonly #sounds: CircuitSounds;
  readonly #checkpoints: Checkpoint[];
  readonly #doors;
  #target: Checkpoint | null = null;
  #lastCheckpoint: Checkpoint | null = null;
  #reachedCount = 0;

  constructor(area: Area, references: THREE.Object3D[], sounds: CircuitSounds) {
    this.#area = area;
    this.#sounds = sounds;
    this.#checkpoints = references.sort((a, b) => a.name.localeCompare(b.name)).map(createCheckpoint);
    this.#doors = { target: createDoor(area, DOOR.targetColor), reached: createDoor(area, DOOR.reachedColor) };
  }

  get count(): number {
    return this.#checkpoints.length;
  }

  get last(): Checkpoint | null {
    return this.#lastCheckpoint;
  }

  hideDoors(): void {
    this.#doors.reached.mesh.visible = false;
    this.#doors.target.mesh.visible = false;
  }

  reset(): void {
    this.hideDoors();
    const first = this.#checkpoints[0];
    if (first) this.#setTarget(first);
    this.#reachedCount = 0;
    this.#lastCheckpoint = null;
  }

  clearTarget(): void {
    this.#target = null;
    this.#doors.target.mesh.visible = false;
  }

  detect(position: THREE.Vector2, onLapComplete: () => void): void {
    const sensor = { center: position, radius: CHECKPOINT.radius };
    for (const checkpoint of this.#checkpoints) {
      if (segmentCircleIntersection(checkpoint.a, checkpoint.b, sensor).length) this.#reach(checkpoint, onLapComplete);
    }
  }

  #setTarget(checkpoint: Checkpoint): void {
    this.#target = checkpoint;
    placeDoor(this.#doors.target, checkpoint);
  }

  #reach(checkpoint: Checkpoint, onLapComplete: () => void): void {
    if (checkpoint !== this.#target) return;
    const { confetti } = this.#area.game.world;
    confetti?.pop(new THREE.Vector3(checkpoint.a.x, 0, checkpoint.a.y));
    confetti?.pop(new THREE.Vector3(checkpoint.b.x, 0, checkpoint.b.y));
    placeDoor(this.#doors.reached, checkpoint);
    this.#lastCheckpoint = checkpoint;
    this.#reachedCount += 1;
    this.#sounds.checkpoint.play(this.#reachedCount);

    const isLapComplete = this.#reachedCount === this.#checkpoints.length + 1;
    const next = this.#checkpoints[this.#reachedCount % this.#checkpoints.length];
    if (isLapComplete) onLapComplete();
    else if (next) this.#setTarget(next);
  }
}
