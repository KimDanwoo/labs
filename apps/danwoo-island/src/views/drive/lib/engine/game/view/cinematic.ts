import gsap from 'gsap';
import * as THREE from 'three/webgpu';

const CINEMATIC = { inSeconds: 1.5, outSeconds: 1, nonIdealRatioOffset: 10 } as const;

export class Cinematic {
  active = false;
  progress = 0;
  readonly #position = new THREE.Vector3();
  readonly #target = new THREE.Vector3();
  readonly #dummy: THREE.PerspectiveCamera;
  readonly #ratioOverflow: () => number;

  constructor(camera: THREE.PerspectiveCamera, ratioOverflow: () => number) {
    this.#dummy = camera.clone();
    this.#ratioOverflow = ratioOverflow;
  }

  start = (position: THREE.Vector3, target: THREE.Vector3): void => {
    this.active = true;
    this.#position.copy(position);
    this.#target.copy(target);
    const overflow = this.#ratioOverflow();
    if (overflow > 0) {
      const pullBack = this.#position
        .clone()
        .sub(this.#target)
        .setLength(overflow * CINEMATIC.nonIdealRatioOffset);
      this.#position.add(pullBack);
    }
    gsap.to(this, { progress: 1, duration: CINEMATIC.inSeconds, ease: 'power2.inOut', overwrite: true });
  };

  end = (): void => {
    this.active = false;
    gsap.to(this, { progress: 0, duration: CINEMATIC.outSeconds, ease: 'power2.inOut', overwrite: true });
  };

  blendInto(camera: THREE.Camera): void {
    if (this.progress <= 0) return;
    this.#dummy.position.copy(this.#position);
    this.#dummy.lookAt(this.#target);
    camera.position.lerp(this.#dummy.position, this.progress);
    camera.quaternion.slerp(this.#dummy.quaternion, this.progress);
  }
}
