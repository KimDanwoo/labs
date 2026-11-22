import gsap from 'gsap';
import { atan, color, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { Audio } from '@views/drive/lib/engine/game/audio';
import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { introCenter } from '@views/drive/lib/engine/game/introCenter';
import { prefersDataSaving } from '@views/drive/lib/engine/game/jukebox/idle';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import type { Intro } from '@views/drive/lib/engine/game/world/intro';
import { TIDE_REVEAL } from '@views/drive/lib/engine/game/world/tideLoading';

const SKIP_PATTERN = /skip/i;
const SKIP_SPEED = 4;
const HOVER_INTENSITY = 1.22;
const HOVER_DURATION = 0.2;
const OPEN_RADIUS = 4.3;
const FULL_RADIUS = 30;
const OPEN_DURATION = 1.8;
const SETTLE_DURATION = 2.6;
const UNBOUNDED_RADIUS = 99999;
const INTRO_ZOOM = { start: 0.6, settled: 0.24, portraitSettled: 0.08 } as const;
const INTRO_SEE_THROUGH = 0.5;
const FOAM_THICKNESS = 0.45;
const SWELL = {
  strength: 0.08,
  waves: [
    { lobes: 5, speed: 0.9, weight: 0.6 },
    { lobes: 11, speed: -1.7, weight: 0.4 },
  ],
} as const;
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
  readonly thickness = uniform(FOAM_THICKNESS);
  readonly color = uniform(color(TIDE_REVEAL.color));
  readonly intensity = uniform(TIDE_REVEAL.intensity);
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
    game.ticker.events.on('tick', this.#update, TICK_ORDER.reveal);
  }

  distanceFrom(position: THREE.Node<'vec2'>): THREE.Node<'float'> {
    const offset = position.sub(this.position2Uniform).toVar();
    const angle = atan(offset.y, offset.x);
    const time = getGame().ticker.elapsedUniform;
    const swell = SWELL.waves
      .map(({ lobes, speed, weight }) => angle.mul(lobes).add(time.mul(speed)).sin().mul(weight))
      .reduce((sum, wave) => sum.add(wave));
    return offset.length().div(swell.mul(SWELL.strength).add(1));
  }

  start(onLabelShown: () => void): void {
    const game = getGame();
    requireIntro().hideLoader(() => {
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
      game.ticker.wait(1, () => {
        intro.showLabel();
        onLabelShown();
      });

      const { islandTrees } = game.world;
      if (islandTrees) islandTrees.seeThroughMultiplier = INTRO_SEE_THROUGH;

      if (isSkipping()) this.#open();
      else this.#waitForStart();
    });
  }

  #waitForStart(): void {
    const { audio, inputs, rayCursor } = getGame();
    if (!prefersDataSaving()) audio.preloadMusic();
    const center = this.position.clone();
    center.y = 0;

    const shapes = [new THREE.Sphere(center, OPEN_RADIUS), requireIntro().promptMesh].filter((shape) => shape !== null);
    const intersects = shapes.map((shape) =>
      rayCursor.addIntersect({
        active: true,
        shape,
        onEnter: () => this.#tweenHover(HOVER_INTENSITY),
        onLeave: () => this.#tweenHover(1),
      }),
    );
    const proceed = (): void => {
      this.#open();
      inputs.events.off('introStart', proceed);
      for (const intersect of intersects) rayCursor.removeIntersect(intersect);
    };
    for (const intersect of intersects) intersect.onClick = proceed;

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

    const { islandTrees } = game.world;
    if (islandTrees) {
      gsap.to(islandTrees, { seeThroughMultiplier: 1, ease: 'power1.inOut', duration: 2 / speed(), overwrite: true });
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
    this.intensity.value = TIDE_REVEAL.intensity * this.#hover.multiplier;
  }
}
