import { FLIP, STUCK, WHEEL_COUNT } from '@views/drive/lib/engine/game/physics/vehicleConfig';
import { smallestAngle } from '@views/drive/lib/engine/game/utilities/maths';

export class StuckDetector {
  active = false;
  #samples: [distance: number, duration: number][] = [];
  #distance = 0;
  #duration = 0;

  accumulate(distance: number, duration: number): void {
    this.#samples.unshift([distance, duration]);
    this.#distance = 0;
    this.#duration = 0;
    for (const [index, [sampleDistance, sampleDuration]] of this.#samples.entries()) {
      if (this.#duration >= STUCK.duration) {
        this.#samples.splice(index);
        break;
      }
      this.#distance += sampleDistance;
      this.#duration += sampleDuration;
    }
  }

  get isStuck(): boolean {
    return this.#duration >= STUCK.duration && this.#distance < STUCK.distance;
  }
}
export class FlipDetector {
  #isInAir = false;
  #previousPitch = 0;
  #pitch = 0;
  #previousRoll = 0;
  #roll = 0;

  test(contactCount: number, pitch: number, roll: number): number | null {
    const hasJustLeftGround = contactCount === 0 && !this.#isInAir;
    if (hasJustLeftGround) {
      this.#isInAir = true;
      this.#previousPitch = pitch;
      this.#pitch = 0;
      this.#previousRoll = roll;
      this.#roll = 0;
    }

    if (contactCount < WHEEL_COUNT) {
      if (this.#isInAir) {
        this.#pitch += smallestAngle(this.#previousPitch, pitch);
        this.#previousPitch = pitch;
        this.#roll += smallestAngle(this.#previousRoll, roll);
        this.#previousRoll = roll;
      }
      return null;
    }

    if (!this.#isInAir) return null;
    this.#isInAir = false;
    const isFlip = Math.abs(this.#pitch) < FLIP.maxPitch && Math.abs(this.#roll) > FLIP.minRoll;
    return isFlip ? Math.sign(this.#roll) : null;
  }

  resetRotation(): void {
    this.#pitch = 0;
    this.#roll = 0;
  }
}
