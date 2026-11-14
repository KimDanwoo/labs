const ROLL = { damping: 4, pullStrength: 100, kickStrength: 1 } as const;

export class CameraRoll {
  value = 0;
  #speed = 0;

  kick = (strength = 1): void => {
    this.#speed = strength * ROLL.kickStrength * (Math.random() < 0.5 ? -1 : 1);
  };

  advance(deltaScaled: number): number {
    this.#speed += -this.value * ROLL.pullStrength * deltaScaled;
    this.value += this.#speed * deltaScaled;
    this.#speed *= 1 - ROLL.damping * deltaScaled;
    return this.value;
  }
}
