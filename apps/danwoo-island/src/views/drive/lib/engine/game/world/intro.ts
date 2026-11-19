import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { setStartupStage, STARTUP } from '../../islandStartup';
import { getGame } from '../gameContext';
import { introCenter } from '../introCenter';
import { TICK_ORDER } from '../tickOrder';
import {
  glowRingMaterial,
  LABEL_DISTANCE,
  LABEL_HEIGHT,
  LABEL_HIDDEN_SCALE,
  PromptText,
  RING,
  SoundButton,
  tweenScale,
} from './introPrompt';
import { isTideLoading, tideRingGeometry, tideRingMaterial } from './tideLoading';

export class Intro {
  readonly center: THREE.Vector3;
  readonly label = new THREE.Group();
  readonly #ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicNodeMaterial>;
  readonly #smoothedProgress = uniform(0);
  #progress = 0;
  #text: PromptText | null = null;
  #soundButton: SoundButton | null = null;
  readonly #update = (): void => this.#tick();

  constructor() {
    const game = getGame();
    this.center = introCenter(game.respawns);
    this.#ring = this.#createRing();
    this.#placeLabel();
    game.ticker.events.on('tick', this.#update, TICK_ORDER.intro);
  }

  #createRing(): THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicNodeMaterial> {
    const { radius, thickness, segments } = RING;
    const geometry = isTideLoading
      ? tideRingGeometry(radius)
      : new THREE.RingGeometry(radius - thickness, radius, segments, 1);
    const material = isTideLoading
      ? tideRingMaterial(this.#smoothedProgress, radius)
      : glowRingMaterial(this.#smoothedProgress);
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(this.center);
    ring.position.y = RING.elevation;
    ring.rotation.x = -Math.PI * 0.5;
    ring.rotation.z = Math.PI * 0.5;
    getGame().scene.add(ring);
    return ring;
  }

  #placeLabel(): void {
    const game = getGame();
    const { theta, phi } = game.view.spherical;
    const towardCamera = new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta));
    this.label.position.copy(this.center).addScaledVector(towardCamera, LABEL_DISTANCE);
    this.label.position.y = LABEL_HEIGHT;
    this.label.rotation.reorder('YXZ');
    this.label.rotation.y = theta;
    this.label.rotation.x = phi - Math.PI / 2;
    this.label.scale.setScalar(LABEL_HIDDEN_SCALE);
    game.scene.add(this.label);
  }

  hideRing(onHidden: () => void): void {
    const ring = this.#ring;
    tweenScale(ring, {
      from: 1,
      to: 0,
      duration: 1.5,
      ease: 'power4.in',
      onComplete: () => {
        onHidden();
        ring.removeFromParent();
      },
    });
  }

  get promptMesh(): THREE.Mesh | null {
    return this.#text?.mesh ?? null;
  }

  createLabelContent(): void {
    this.#text = new PromptText();
    this.#soundButton = new SoundButton(this.label);
    this.label.add(this.#text.mesh, this.#soundButton.mesh);
  }

  showLabel(): void {
    setStartupStage(STARTUP.ready);
    tweenScale(this.label, { from: 0, to: 1, duration: 2, delay: 1, ease: 'elastic.out(0.5)' });
  }

  hideLabel(): void {
    tweenScale(this.label, {
      from: 1,
      to: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.#text?.mesh.removeFromParent();
        this.#soundButton?.mesh.removeFromParent();
        if (this.#soundButton) getGame().rayCursor.removeIntersect(this.#soundButton.intersect);
      },
    });
  }

  updateProgress(progress: number): void {
    this.#progress = progress;
  }

  #tick(): void {
    const smoothed = this.#smoothedProgress;
    smoothed.value += (this.#progress - smoothed.value) * getGame().ticker.delta * RING.smoothing;
  }

  destroy(): void {
    const game = getGame();
    this.label.removeFromParent();
    this.#ring.geometry.dispose();
    this.#ring.material.dispose();
    this.#text?.dispose();
    this.#soundButton?.dispose();
    game.ticker.events.off('tick', this.#update);
  }
}
