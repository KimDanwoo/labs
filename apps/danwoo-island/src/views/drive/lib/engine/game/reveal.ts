import gsap from 'gsap';
import { color, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { Audio } from './audio';
import { getGame } from './gameContext';
import { introCenter } from './introCenter';
import type { Intro } from './world/intro';
import { isTideLoading, TIDE_REVEAL } from './world/tideLoading';

const SKIP_PATTERN = /skip/i;
const SKIP_SPEED = 4;
const TICK_ORDER = 10;
const HOVER_INTENSITY = 1.22;
const HOVER_DURATION = 0.2;
const OPEN_RADIUS = 4.3;
const FULL_RADIUS = 30;
const OPEN_DURATION = 1.8;
const SETTLE_DURATION = 2.6;
const UNBOUNDED_RADIUS = 99999;
const INTRO_ZOOM = { start: 0.6, settled: 0.24, portraitSettled: 0.08 } as const;
const INTRO_SEE_THROUGH = 0.5;
const REVEAL_DEFAULTS = { thickness: 0.05, color: '#e88eff', intensity: 5.5 } as const;
const START_KEYS = [
  'Gamepad.cross',
  'Keyboard.Enter',
  'Keyboard.ArrowUp',
  'Keyboard.ArrowDown',
  'Keyboard.KeyW',
  'Keyboard.KeyD',
];

const isSkipping = (): boolean => SKIP_PATTERN.test(location.hash);
const speed = (): number => (isSkipping() ? SKIP_SPEED : 1);

function requireIntro(): Intro {
  const { intro } = getGame().world;
  if (!intro) throw new Error('Intro is already finished');
  return intro;
}

export class Reveal {
  readonly position: THREE.Vector3;
  readonly position2Uniform: THREE.UniformNode<'vec2', THREE.Vector2>;
  readonly distance = uniform(0);
  readonly thickness = uniform(REVEAL_DEFAULTS.thickness);
  readonly color = uniform(color(REVEAL_DEFAULTS.color));
  readonly intensity = uniform(REVEAL_DEFAULTS.intensity);
  readonly #hover = { multiplier: 1 };
  readonly #sound: ReturnType<Audio['register']>;
  readonly #update = (): void => this.#tick();

  constructor() {
    const game = getGame();
    this.position = introCenter(game.respawns);
    this.position2Uniform = uniform(vec2(this.position.x, this.position.z));
    this.#sound = game.audio.register({
      path: 'sounds/reveal/reveal-1.mp3',
      autoplay: false,
      loop: false,
      volume: 0.5,
      preload: true,
    });
    game.ticker.events.on('tick', this.#update, TICK_ORDER);
  }

  start(): void {
    const game = getGame();
    requireIntro().hideRing(() => {
      game.world.grid.show();
      this.distance.value = 0;
      gsap.to(this.distance, { value: OPEN_RADIUS, ease: 'back.out(1.7)', duration: 2 / speed(), overwrite: true });

      const { zoom } = game.view;
      zoom.smoothedRatio = INTRO_ZOOM.start;
      zoom.baseRatio = INTRO_ZOOM.start;
      const settled = innerHeight > innerWidth ? INTRO_ZOOM.portraitSettled : INTRO_ZOOM.settled;
      gsap.to(zoom, { baseRatio: settled, ease: 'power1.inOut', duration: 1.25 / speed(), overwrite: true });

      const intro = requireIntro();
      intro.createLabelContent();
      game.ticker.wait(1, () => intro.showLabel());

      const { palmTrees } = game.world;
      if (palmTrees) palmTrees.seeThroughMultiplier = INTRO_SEE_THROUGH;

      if (isSkipping()) this.#open();
      else this.#waitForStart();
    });
  }

  #waitForStart(): void {
    const { inputs, rayCursor } = getGame();
    const center = this.position.clone();
    center.y = 0;

    const intersect = rayCursor.addIntersect({
      active: true,
      shape: new THREE.Sphere(center, OPEN_RADIUS),
      onEnter: () => this.#tweenHover(HOVER_INTENSITY),
      onLeave: () => this.#tweenHover(1),
    });
    const proceed = (): void => {
      this.#open();
      inputs.events.off('introStart', proceed);
      rayCursor.removeIntersect(intersect);
    };
    intersect.onClick = proceed;

    inputs.addActions([{ name: 'introStart', categories: ['intro'], keys: START_KEYS }]);
    inputs.events.on('introStart', proceed);
  }

  #tweenHover(multiplier: number): void {
    gsap.to(this.#hover, { multiplier, duration: HOVER_DURATION, overwrite: true });
  }

  #open(): void {
    const game = getGame();
    game.audio.init();
    this.#sound.play();

    gsap.to(this.distance, {
      value: FULL_RADIUS,
      ease: 'power2.in',
      duration: OPEN_DURATION / speed(),
      overwrite: true,
      onComplete: () => {
        this.distance.value = UNBOUNDED_RADIUS;
      },
    });

    requireIntro().hideLabel();
    game.inputs.filters.clear();
    game.inputs.filters.add('wandering');
    game.view.focusPoint.magnet.active = true;

    gsap.to(game.view.zoom, {
      baseRatio: 0,
      ease: 'sine.inOut',
      duration: SETTLE_DURATION / speed(),
      overwrite: true,
      onComplete: () => this.#finish(),
    });

    const { palmTrees } = game.world;
    if (palmTrees) {
      gsap.to(palmTrees, { seeThroughMultiplier: 1, ease: 'power1.inOut', duration: 2 / speed(), overwrite: true });
    }
  }

  #finish(): void {
    const game = getGame();
    game.interactivePoints.recover();
    game.world.finishIntro();
    game.overlay.moveOnTop();
    game.menu.preopen();
    game.ticker.events.off('tick', this.#update);
  }

  #tick(): void {
    const { multiplier } = this.#hover;
    if (isTideLoading) {
      this.color.value.set(TIDE_REVEAL.color);
      this.intensity.value = TIDE_REVEAL.intensity * multiplier;
      return;
    }
    const { dayCycles } = getGame();
    this.color.value.copy(dayCycles.colorOf('revealColor'));
    this.intensity.value = dayCycles.numberOf('revealIntensity') * multiplier;
  }
}
