import gsap from 'gsap';

import { clamp } from '@views/drive/lib/engine/game/utilities/maths';

export type Stage = readonly [from: number, to: number];

interface Timing {
  readonly duration: number;
  readonly ease: string;
}

const STOW: Timing = { duration: 0.5, ease: 'none' };

export const smooth = gsap.parseEase('power2.inOut');
export const overshoot = gsap.parseEase('back.out(2.6)');

export function staged(progress: number, [from, to]: Stage): number {
  return clamp((progress - from) / (to - from), 0, 1);
}

export class Deployment {
  readonly #state = { value: 0 };
  readonly #deploy: Timing;
  #isDeployed = false;

  constructor(deploy: Timing) {
    this.#deploy = deploy;
  }

  get progress(): number {
    return this.#state.value;
  }

  follow(shouldDeploy: boolean): boolean {
    if (shouldDeploy === this.#isDeployed) return false;
    this.#isDeployed = shouldDeploy;
    const timing = shouldDeploy ? this.#deploy : STOW;
    gsap.to(this.#state, { value: Number(shouldDeploy), overwrite: true, ...timing });
    return true;
  }
}
