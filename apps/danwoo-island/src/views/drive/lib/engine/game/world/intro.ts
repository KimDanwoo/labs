import gsap from 'gsap';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { introCenter } from '@views/drive/lib/engine/game/introCenter';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import {
  LABEL_DISTANCE,
  LABEL_HEIGHT,
  LABEL_HIDDEN_SCALE,
  LOADER,
  PromptText,
  SoundButton,
  tweenScale,
} from '@views/drive/lib/engine/game/world/introPrompt';
import { tideWaveGeometry, tideWaveMaterial } from '@views/drive/lib/engine/game/world/tideLoading';
import { setStartupStage, STARTUP } from '@views/drive/lib/engine/islandStartup';

export class Intro {
  readonly center: THREE.Vector3;
  readonly label = new THREE.Group();
  readonly #loader: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicNodeMaterial>;
  readonly #smoothedProgress = uniform(0);
  readonly #loaderOpacity = uniform(1);
  #progress = 0;
  #text: PromptText | null = null;
  #soundButton: SoundButton | null = null;
  readonly #update = (): void => this.#tick();

  constructor() {
    const game = getGame();
    this.center = introCenter(game.respawns);
    this.#loader = this.#createLoader();
    this.#placeLabel();
    game.ticker.events.on('tick', this.#update, TICK_ORDER.intro);
  }

  #createLoader(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicNodeMaterial> {
    const game = getGame();
    const loader = new THREE.Mesh(tideWaveGeometry(), tideWaveMaterial(this.#smoothedProgress, this.#loaderOpacity));
    loader.position.copy(this.center);
    loader.position.y = LOADER.elevation;
    loader.rotation.reorder('YXZ');
    loader.rotation.y = game.view.spherical.theta;
    loader.rotation.x = -Math.PI * 0.5;
    game.scene.add(loader);
    return loader;
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

  hideLoader(onHidden: () => void): void {
    const loader = this.#loader;
    gsap.to(this.#loaderOpacity, {
      value: 0,
      duration: LOADER.hideDuration,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        onHidden();
        loader.removeFromParent();
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
    smoothed.value += (this.#progress - smoothed.value) * getGame().ticker.delta * LOADER.smoothing;
  }

  destroy(): void {
    const game = getGame();
    this.label.removeFromParent();
    this.#loader.geometry.dispose();
    this.#loader.material.dispose();
    this.#text?.dispose();
    this.#soundButton?.dispose();
    game.ticker.events.off('tick', this.#update);
  }
}
