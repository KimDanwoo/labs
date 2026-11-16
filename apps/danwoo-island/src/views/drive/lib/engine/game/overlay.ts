import gsap from 'gsap';
import { color, Fn, If, mix, positionGeometry, screenUV, texture, uniform, vec4, viewportCoordinate } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from './audioItem';
import { getGame } from './gameContext';

const COLORS = { start: '#251f2b', end: '#1d1721' } as const;
const PATTERN_SIZE = 200;
const STROKE_SIZE = 10;
const STROKE_WEIGHT = 0.2;
const PATTERN_ALPHA_MAX = 0.68;
const DIAGONAL_AMPLITUDE = 0.5;
const DIAGONAL_INVERT_MULTIPLIER = 1 + DIAGONAL_AMPLITUDE * 2;
const SCREEN_DIAGONAL = 1.414;
const COLOR_NOISE = 0.2;
const RENDER_ORDER = 99;
const DURATION = { show: 2, hide: 4 } as const;
const SWOOSH_VOLUME = 0.25;

export class Overlay {
  readonly #progress = uniform(0);
  readonly #patternSize = uniform(PATTERN_SIZE);
  readonly #inverted = uniform(0);
  readonly #mesh: THREE.Mesh;
  readonly #sounds: { show: AudioItem; hide: AudioItem };

  constructor() {
    const game = getGame();
    this.#sounds = {
      show: game.audio.register({
        path: 'sounds/swoosh/Swoosh 02.mp3',
        autoplay: false,
        loop: false,
        volume: SWOOSH_VOLUME,
      }),
      hide: game.audio.register({
        path: 'sounds/swoosh/Swoosh 05.mp3',
        autoplay: false,
        loop: false,
        volume: SWOOSH_VOLUME,
      }),
    };
    this.#patternSize.value = PATTERN_SIZE * game.viewport.pixelRatio;

    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false });
    material.outputNode = this.#outputNode();
    material.vertexNode = vec4(positionGeometry.x, positionGeometry.y, 0, 1);
    this.#mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.#mesh.frustumCulled = false;
    this.#mesh.renderOrder = RENDER_ORDER;
    this.#mesh.visible = true;
    game.scene.add(this.#mesh);

    game.viewport.events.on('change', () => {
      this.#patternSize.value = PATTERN_SIZE * game.viewport.pixelRatio;
    });
  }

  #outputNode(): THREE.Node<'vec4'> {
    const { noises } = getGame();
    const pattern = getGame().texture('overlayPatternTexture');
    const strokeSize = uniform(STROKE_SIZE);
    const colorStart = uniform(color(COLORS.start));
    const colorEnd = uniform(color(COLORS.end));
    return Fn(() => {
      const isInverted = this.#inverted.greaterThan(0.5);
      const strokeMask = viewportCoordinate.x.add(viewportCoordinate.y).div(strokeSize).mod(1).sub(0.5).mul(2).abs();
      const patternUv = viewportCoordinate.div(this.#patternSize).mod(1);
      const patternMask = texture(pattern, patternUv).a.remap(0, PATTERN_ALPHA_MAX, 0, 1).toVar();
      If(isInverted, () => {
        patternMask.assign(patternMask.oneMinus());
      });
      const mask = patternMask.add(strokeMask.mul(STROKE_WEIGHT)).mul(1 / (1 + STROKE_WEIGHT));

      const diagonalRatio = screenUV.length().div(SCREEN_DIAGONAL).toVar();
      If(isInverted, () => {
        diagonalRatio.assign(diagonalRatio.oneMinus());
      });
      const diagonalProgress = this.#progress
        .sub(diagonalRatio.mul(DIAGONAL_AMPLITUDE))
        .mul(DIAGONAL_INVERT_MULTIPLIER);
      diagonalProgress.lessThan(mask).discard();

      const colorHash = texture(noises.hash, viewportCoordinate.div(noises.resolution)).r.sub(0.5).mul(COLOR_NOISE);
      return vec4(mix(colorStart, colorEnd, screenUV.length().add(colorHash)), 1);
    })();
  }

  show(onShown?: () => void): void {
    this.#inverted.value = 0;
    this.#mesh.visible = true;
    this.#sounds.show.play();
    gsap.to(this.#progress, {
      value: 1,
      ease: 'power1.inOut',
      overwrite: true,
      duration: DURATION.show,
      onComplete: () => onShown?.(),
    });
  }

  hide(onHidden?: () => void): void {
    this.#inverted.value = 1;
    this.#sounds.hide.play();
    gsap.to(this.#progress, {
      value: 0,
      ease: 'power1.inOut',
      overwrite: true,
      duration: DURATION.hide,
      onComplete: () => {
        this.#mesh.visible = false;
        onHidden?.();
      },
    });
  }

  moveOnTop(): void {
    getGame().scene.add(this.#mesh);
  }
}
