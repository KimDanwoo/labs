import gsap from 'gsap';
import { color, Fn, mix, positionGeometry, screenSize, screenUV, sin, smoothstep, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '@views/drive/lib/engine/game/audioItem';
import { getGame } from '@views/drive/lib/engine/game/gameContext';

const COLORS = { shallow: '#1FA7B8', deep: '#0B6A80', foam: '#F4FFFB' } as const;
const TIDE = { margin: 0.16, foamWidth: 0.035 } as const;
const SWELL = { amplitude: 0.045, frequency: 5, speed: 1.6 } as const;
const CHOP = { amplitude: 0.018, frequency: 13, speed: 2.7 } as const;
const RENDER_ORDER = 99;
const DURATION = { show: 1.1, hide: 1.6 } as const;
const SWOOSH_VOLUME = 0.25;

export class Overlay {
  readonly #progress = uniform(0);
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
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false });
    material.outputNode = this.#outputNode();
    material.vertexNode = vec4(positionGeometry.x, positionGeometry.y, 0, 1);
    this.#mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.#mesh.frustumCulled = false;
    this.#mesh.renderOrder = RENDER_ORDER;
    this.#mesh.visible = true;
    game.scene.add(this.#mesh);
  }

  #outputNode(): THREE.Node<'vec4'> {
    const { elapsedUniform } = getGame().ticker;
    return Fn(() => {
      const along = screenUV.x.mul(screenSize.x.div(screenSize.y));
      const height = screenUV.y.oneMinus();
      const swell = sin(along.mul(SWELL.frequency).add(elapsedUniform.mul(SWELL.speed))).mul(SWELL.amplitude);
      const chop = sin(along.mul(CHOP.frequency).sub(elapsedUniform.mul(CHOP.speed))).mul(CHOP.amplitude);
      const tide = mix(this.#progress, this.#progress.oneMinus(), this.#inverted);
      const surface = tide
        .mul(1 + TIDE.margin * 2)
        .sub(TIDE.margin)
        .add(swell)
        .add(chop);
      const depth = mix(surface.sub(height), height.sub(surface), this.#inverted);
      depth.lessThan(0).discard();

      const water = mix(color(COLORS.shallow), color(COLORS.deep), smoothstep(0, 1, depth));
      const foam = smoothstep(TIDE.foamWidth, 0, depth);
      return vec4(mix(water, color(COLORS.foam), foam), 1);
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
