import gsap from 'gsap';
import type * as THREE from 'three/webgpu';

import type { Area } from './area';
import { COUNTDOWN_INTERVAL, type CircuitSounds, LIGHT_STEP, startingLightsMesh } from './circuitConfig';

export class CircuitLights {
  readonly #lights: { mesh: THREE.Mesh; red: THREE.Material; green: THREE.Material; baseZ: number };
  readonly #countdown: gsap.core.Timeline;
  #onGreenLight: (() => void) | null = null;

  constructor(game: Area['game'], reference: THREE.Object3D, sounds: CircuitSounds) {
    const mesh = startingLightsMesh(reference);
    const { materials } = game;
    this.#lights = {
      mesh,
      red: materials.get('emissiveOrangeRadialGradient'),
      green: materials.get('emissiveGreenRadialGradient'),
      baseZ: mesh.position.z,
    };
    this.#countdown = this.#createCountdown(sounds);
  }

  #createCountdown(sounds: CircuitSounds): gsap.core.Timeline {
    const lights = this.#lights;
    const step = (count: number) => () => {
      sounds.countdown.play();
      lights.mesh.position.z = lights.baseZ + LIGHT_STEP * count;
    };
    const timeline = gsap.timeline({ paused: true });
    timeline.add(() => {
      lights.mesh.visible = true;
      step(1)();
    });
    timeline.add(gsap.delayedCall(COUNTDOWN_INTERVAL, step(2)));
    timeline.add(gsap.delayedCall(COUNTDOWN_INTERVAL, step(3)));
    timeline.add(
      gsap.delayedCall(COUNTDOWN_INTERVAL, () => {
        sounds.go.play();
        lights.mesh.material = lights.green;
        this.#onGreenLight?.();
      }),
    );
    timeline.add(gsap.delayedCall(COUNTDOWN_INTERVAL, () => {}));
    return timeline;
  }

  reset(): void {
    this.#lights.mesh.visible = false;
    this.#lights.mesh.material = this.#lights.red;
  }

  start(onGreenLight: () => void): void {
    this.#onGreenLight = onGreenLight;
    this.#countdown.seek(0);
    this.#countdown.play();
  }

  pause(): void {
    this.#countdown.pause();
  }
}
