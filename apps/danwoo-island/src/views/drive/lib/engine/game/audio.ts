import gsap from 'gsap';
import { Howl, Howler } from 'howler';
import * as THREE from 'three/webgpu';

import { worldAsset } from '../../../config/worldAsset';
import { WORLD_CONFIG } from '../worldConfig';
import { AudioMute } from './audioMute';
import { Events } from './events';
import { getGame } from './gameContext';
import { createElement } from './utilities/createElement';
import { clamp, remapClamp } from './utilities/maths';

export type SoundHandler = (item: AudioItem, ...args: unknown[]) => void;

export interface SoundOptions {
  path: string;
  group?: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  preload?: boolean;
  positions?: THREE.Vector3 | THREE.Vector3[];
  distanceFade?: number;
  rate?: number;
  antiSpam?: number;
  onPlay?: SoundHandler;
  onPlaying?: (item: AudioItem) => void;
}

interface Song {
  path: string;
  name: string;
  sound: Howl;
  isLoaded: boolean;
}

interface VectorLike {
  x: number;
  y: number;
  z: number;
}

const IS_IOS =
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const TICK_ORDER = 14;
const DEFAULT_VOLUME = 0.5;
const DEFAULT_ANTI_SPAM = 0.1;
const SOUND_POOL = 2;
const RATE_RANGE = { min: 0.5, max: 4 } as const;
const AUDIBLE_VOLUME = 0.01;
const CAMERA_DEPTH_SCALE = 0.1;
const MAX_PARALLEL_LOADS = 4;
const IDLE_TIMEOUT_MS = 2000;

function scheduleIdle(task: () => void): void {
  if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(task, 0);
}

const SONG_ROTATION_MS = 3 * 60 * 1000;
const SONG_SWITCH_DELAY = 1;
const SONG_NOTICE_DURATION = 5;
const SONGS = [{ path: 'sounds/musics/baram.mp3', name: '바람 · danwoo0' }] as const;
const AMBIENT_DISTANCE = 30;
const FIRE_FADE_DISTANCE = 13;
const HIT_FADE_DISTANCE = 20;
const CRICKETS_VOLUME = 0.65;
const MUTE_KEY = {
  name: 'mute',
  categories: ['intro', 'modal', 'menu', 'racing', 'cinematic', 'wandering'],
  keys: ['Keyboard.l'],
};
const BIRD_TWEETS = [
  'sounds/birdTweets/24074 small bird tweet calling-full-1.mp3',
  'sounds/birdTweets/24074 small bird tweet calling-full-2.mp3',
  'sounds/birdTweets/20711 finch bird isolated tweet-full.mp3',
  'sounds/birdTweets/30673 Yellowhammer bird tweet 3-full.mp3',
  'sounds/birdTweets/31062 Ortolan bird tweet-full.mp3',
  'sounds/birdTweets/31451 Ortolan bunting bird isolated tweet-full.mp3',
];
const HIT_SOUNDS = {
  hitDefault: [
    ['sounds/hits/defaults/Stone_Hit_Crash_106-2.mp3', 0.35],
    ['sounds/hits/defaults/Stone_Hit_Crash_071-1.mp3', 0.35],
    ['sounds/hits/defaults/Stone_Hit_Crash_106-1.mp3', 0.35],
    ['sounds/hits/defaults/Impact Soft 01.mp3', 0.8],
    ['sounds/hits/defaults/Impact Soft 02.mp3', 0.8],
    ['sounds/hits/defaults/Impact Soft 03.mp3', 0.8],
    ['sounds/hits/defaults/Impact Soft 04.mp3', 0.8],
  ],
  hitBrick: [
    ['sounds/hits/bricks/24445 brick light hitting-full-2.mp3', 0.6],
    ['sounds/hits/bricks/41559 Stone brick fall hit 01-full-1.mp3', 0.6],
    ['sounds/hits/bricks/41563 Stone brick fall hit 05-full-1.mp3', 0.6],
    ['sounds/hits/bricks/BrickSetDown_BW.5803-1.mp3', 0.6],
  ],
  hitMetal: [
    ['sounds/hits/metal/EQUIPTact_Fire Gear_SDFIRE0411.mp3', 0.6],
    ['sounds/hits/metal/Metal Clip Hit.mp3', 0.6],
    ['sounds/hits/metal/Metalic 3.mp3', 0.6],
  ],
} as const satisfies Record<string, readonly (readonly [string, number])[]>;

const HIT_GROUPS = ['hitDefault', 'hitBrick', 'hitMetal'] as const satisfies readonly (keyof typeof HIT_SOUNDS)[];

function isVectorLike(value: unknown): value is VectorLike {
  return typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'z' in value;
}

export function moveSoundTo(item: AudioItem, position: unknown): void {
  if (isVectorLike(position)) item.firstPosition().copy(position);
}

function randomOffset(distance: number): number {
  return Math.random() < 0.5 ? distance : -distance;
}

function randomNearbyPosition(distance = AMBIENT_DISTANCE): THREE.Vector3 {
  const { position } = getGame().view.focusPoint;
  return new THREE.Vector3(position.x + randomOffset(distance), position.y, position.z + randomOffset(distance));
}

function toPositions(positions: SoundOptions['positions']): THREE.Vector3[] | null {
  if (!positions) return null;
  return Array.isArray(positions) ? positions : [positions];
}

function closestTo(
  positions: readonly THREE.Vector3[],
  target: THREE.Vector3,
): { position: THREE.Vector3; distance: number } | null {
  let closest: { position: THREE.Vector3; distance: number } | null = null;
  for (const position of positions) {
    const distance = position.distanceTo(target);
    if (!closest || distance < closest.distance) closest = { position, distance };
  }
  return closest;
}

export class AudioGroup {
  readonly items: AudioItem[] = [];
  lastPlayedId = -1;

  play(...args: unknown[]): void {
    this.items[(this.lastPlayedId + 1) % this.items.length]?.play(...args);
  }

  playRandomNext(...args: unknown[]): void {
    const delta = 1 + Math.floor(Math.random() * (this.items.length - 2));
    this.items[(this.lastPlayedId + delta) % this.items.length]?.play(...args);
  }
}

export class AudioItem {
  readonly howl: Howl;
  readonly positions: THREE.Vector3[] | null;
  readonly distanceFade: number | null;
  readonly autoplay: boolean;
  readonly id: number;
  rate: number;
  volume: number;
  playing: boolean;
  readonly #group: AudioGroup;
  readonly #antiSpam: number;
  readonly #onPlay: SoundHandler | null;
  readonly onPlaying: ((item: AudioItem) => void) | null;
  #loading: Promise<void> | null = null;
  readonly isEager: boolean;
  #lastPlay = -Infinity;
  #appliedRate = Number.NaN;
  #appliedVolume = Number.NaN;

  constructor(options: SoundOptions, group: AudioGroup, isInitiated: boolean) {
    const volume = options.volume ?? DEFAULT_VOLUME;
    const isPlaying = isInitiated && (options.autoplay ?? false);
    this.#group = group;
    this.id = group.items.length;
    this.howl = new Howl({
      src: [worldAsset(options.path)],
      pool: SOUND_POOL,
      autoplay: isPlaying,
      loop: options.loop ?? false,
      volume,
      preload: false,
      onloaderror: () => reportError(new Error(`Audio load error: ${options.path}`)),
      onend: () => {
        this.playing = false;
      },
    });
    this.positions = toPositions(options.positions);
    this.distanceFade = options.distanceFade ?? null;
    this.rate = options.rate ?? 1;
    this.volume = volume;
    this.#antiSpam = options.antiSpam ?? DEFAULT_ANTI_SPAM;
    this.onPlaying = options.onPlaying ?? null;
    this.#onPlay = options.onPlay ?? null;
    this.isEager = options.preload ?? true;
    this.autoplay = options.autoplay ?? false;
    this.playing = isPlaying;
    if (isPlaying) void this.load();
  }

  load(): Promise<void> {
    this.#loading ??= new Promise((resolve) => {
      this.howl.once('load', () => resolve());
      this.howl.once('loaderror', () => resolve());
      this.howl.load();
    });
    return this.#loading;
  }

  play(...args: unknown[]): void {
    const game = getGame();
    if (!game.audio.initiated) return;
    void this.load();
    if (this.#antiSpam && game.ticker.elapsed - this.#lastPlay < this.#antiSpam) return;

    this.#onPlay?.(this, ...args);
    this.howl.play();
    this.#lastPlay = game.ticker.elapsed;
    this.playing = true;
    this.#group.lastPlayedId = this.id;
  }

  firstPosition(): THREE.Vector3 {
    const position = this.positions?.[0];
    if (!position) throw new Error('Sound has no position');
    return position;
  }

  applyMix(rate: number, volume: number): void {
    if (!this.howl.playing()) {
      this.#appliedRate = Number.NaN;
      this.#appliedVolume = Number.NaN;
      return;
    }
    if (rate !== this.#appliedRate) {
      this.howl.rate(rate);
      this.#appliedRate = rate;
    }
    if (volume === this.#appliedVolume) return;
    this.howl.volume(volume);
    this.howl.mute(volume < AUDIBLE_VOLUME);
    this.#appliedVolume = volume;
  }
}

class Playlist {
  readonly songs: Song[];
  current: Song | null = null;
  readonly #canPlay: () => boolean;
  #index: number;
  #switchCall: gsap.core.Tween | null = null;

  constructor(canPlay: () => boolean) {
    this.#canPlay = canPlay;
    this.songs = SONGS.map(({ path, name }) => ({
      path,
      name,
      isLoaded: false,
      sound: new Howl({
        src: [worldAsset(path)],
        pool: 0,
        html5: !IS_IOS,
        autoplay: false,
        loop: false,
        preload: false,
        volume: 0.2,
        onend: () => this.next(),
      }),
    }));
    this.#index = Math.floor(Date.now() / SONG_ROTATION_MS) % this.songs.length;
  }

  resume(): void {
    if (!this.#canPlay() || this.#switchCall || this.current?.sound.playing()) return;
    this.#startCurrent();
  }

  pause(): void {
    this.#switchCall?.kill();
    this.#switchCall = null;
    this.current?.sound.pause();
  }

  next(): void {
    if (this.#switchCall || !this.#canPlay()) return;
    getGame().audio.groups.get('discChange')?.play();
    this.current?.sound.stop();
    this.#switchCall = gsap.delayedCall(SONG_SWITCH_DELAY, () => {
      this.#switchCall = null;
      if (!this.#canPlay()) return;
      this.#index = (this.#index + 1) % this.songs.length;
      const song = this.#startCurrent();
      getGame().notifications.show(nowPlayingNotice(song.name), { type: 'song', duration: SONG_NOTICE_DURATION });
    });
  }

  preload(): void {
    const song = this.songs[this.#index];
    if (song) this.#load(song);
  }

  #load(song: Song): void {
    if (song.isLoaded) return;
    song.isLoaded = true;
    song.sound.load();
  }

  #startCurrent(): Song {
    const song = this.songs[this.#index];
    if (!song) throw new Error('Playlist is empty');
    this.current = song;
    this.#load(song);
    song.sound.play();
    return song;
  }
}

export function nowPlayingNotice(songName: string): HTMLElement {
  return createElement('div', 'top', [
    createElement('div', 'title', [
      '재생 중',
      document.createElement('br'),
      createElement('span', 'song-name', [songName]),
    ]),
    createElement('div', 'music-note-icon'),
  ]);
}

function hitHandler(baseVolume: number, volumeOf: (force: number) => number): SoundHandler {
  return (item, force, position) => {
    if (typeof force !== 'number' || !isVectorLike(position)) return;
    item.firstPosition().copy(position);
    item.volume = baseVolume * volumeOf(force);
    item.rate = 0.9 + Math.random() * 0.2;
  };
}

const HIT_VOLUME: Record<keyof typeof HIT_SOUNDS, (force: number) => number> = {
  hitDefault: (force) => remapClamp(force, [0, 200], [0, 1]),
  hitBrick: (force) => remapClamp(force, [5, 20], [0, 1]) ** 2,
  hitMetal: (force) => remapClamp(force, [5, 20], [0, 1]) ** 2,
};

export type MusicOwner = 'island' | 'jukebox';

export class Audio {
  readonly events = new Events<{ muteChange: [isMuted: boolean]; backgroundChange: [isBackground: boolean] }>();
  readonly groups = new Map<string, AudioGroup>();
  readonly mute: AudioMute;
  initiated = false;
  playlist: Playlist | null = null;
  readonly #loadQueue: AudioItem[] = [];
  #activeLoads = 0;
  musicOwner: MusicOwner = 'island';
  isBackground = false;
  #globalRate = 1;

  constructor() {
    const game = getGame();
    this.mute = new AudioMute((isMuted) => this.events.trigger('muteChange', isMuted));
    this.#bindMuteControls();
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  init(): void {
    this.#registerAmbients();
    this.#registerOneOffs();
    this.initiated = true;
    this.#startPlaylist();
    for (const group of this.groups.values()) {
      for (const item of group.items) {
        if (item.autoplay && !item.playing) item.play();
      }
    }
    this.#preloadEager();
  }

  #preloadEager(): void {
    this.#queueLoad([...this.groups.values()].flatMap(({ items }) => items).filter((item) => item.isEager));
  }

  #queueLoad(items: readonly AudioItem[]): void {
    this.#loadQueue.push(...items);
    scheduleIdle(() => this.#pumpLoads());
  }

  #pumpLoads(): void {
    while (this.#activeLoads < MAX_PARALLEL_LOADS) {
      const item = this.#loadQueue.shift();
      if (!item) return;
      this.#activeLoads += 1;
      void item.load().then(() => {
        this.#activeLoads -= 1;
        this.#pumpLoads();
      });
    }
  }

  register(options: SoundOptions): AudioItem {
    const groupName = options.group ?? 'all';
    const group = this.groups.get(groupName) ?? new AudioGroup();
    this.groups.set(groupName, group);
    const item = new AudioItem(options, group, this.initiated);
    group.items.push(item);
    if (this.initiated && item.isEager) this.#queueLoad([item]);
    return item;
  }

  claimMusic(): void {
    this.musicOwner = 'jukebox';
    this.playlist?.pause();
  }

  releaseMusic(): void {
    this.musicOwner = 'island';
    this.playlist?.resume();
  }

  preloadMusic(): void {
    if (WORLD_CONFIG.music) this.#ensurePlaylist().preload();
  }

  #ensurePlaylist(): Playlist {
    this.playlist ??= new Playlist(
      () => this.initiated && WORLD_CONFIG.music && this.musicOwner === 'island' && !this.isBackground,
    );
    return this.playlist;
  }

  #startPlaylist(): void {
    this.#ensurePlaylist().resume();
  }

  #registerAmbients(): void {
    const { dayCycles } = getGame();
    this.#registerBirds();
    this.#registerOwl();

    const rooster = this.#randomlyPlaced('rooster', 'sounds/rooster/rooster-crowing.mp3', 0.1, (item) => {
      item.volume = 0.1 + Math.random() * 0.2;
    });
    dayCycles.events.on('night', (isNight) => {
      if (!isNight) rooster.play();
    });

    const wolf = this.#randomlyPlaced(
      'wolf',
      'sounds/wolf/TimberWolvesGroupHowlingSomeWhimpering_S2h0E_04.mp3',
      0.1,
      (item) => {
        item.volume = 0.1 + Math.random() * 0.2;
      },
    );
    dayCycles.events.on('deepNight', (isDeepNight) => {
      if (isDeepNight) wolf.play();
    });

    const crickets = this.register({
      group: 'crickets',
      path: 'sounds/crickets/Crickets.mp3',
      autoplay: true,
      loop: true,
      volume: dayCycles.isInInterval('night') ? CRICKETS_VOLUME : 0,
    });
    dayCycles.events.on('night', (isNight) => {
      gsap.to(crickets, { volume: isNight ? CRICKETS_VOLUME : 0, duration: 15, overwrite: true });
    });

    this.#registerWeather();
    this.#registerFires();
  }

  #randomlyPlaced(group: string, path: string, volume: number, vary: (item: AudioItem) => void): AudioItem {
    return this.register({
      group,
      path,
      autoplay: false,
      loop: false,
      volume,
      positions: new THREE.Vector3(),
      onPlay: (item) => {
        vary(item);
        item.firstPosition().copy(randomNearbyPosition());
      },
    });
  }

  #registerBirds(): void {
    const { dayCycles } = getGame();
    const tweets = BIRD_TWEETS.map((path) =>
      this.#randomlyPlaced('birdTweet', path, 0.3, (item) => {
        item.volume = 0.2 + Math.random() * 0.3;
        item.rate = 1 + Math.random() * 0.7;
      }),
    );
    const tryPlay = (): void => {
      if (!dayCycles.isInInterval('night') && Math.random() < 0.5) {
        tweets[Math.floor(Math.random() * tweets.length)]?.play();
      }
      gsap.delayedCall(0.5 + Math.random() * 5, tryPlay);
    };
    tryPlay();
  }

  #registerOwl(): void {
    const { dayCycles } = getGame();
    const owl = this.#randomlyPlaced('owl', 'sounds/owl/OwlHootingReverberantSeveral_Rik8a_03.mp3', 0.3, (item) => {
      item.volume = 0.2 + Math.random() * 0.25;
      item.rate = 1 + Math.random() * 0.3;
    });
    const delay = (): number => 30 + Math.random() * 60;
    const tryPlay = (): void => {
      if (dayCycles.isInInterval('night') && Math.random() < 0.5) owl.play();
      gsap.delayedCall(delay(), tryPlay);
    };
    gsap.delayedCall(delay(), tryPlay);
  }

  #registerWeather(): void {
    const game = getGame();
    this.register({
      group: 'rain',
      path: 'sounds/rain/soundjay_rain-on-leaves_main-01.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        item.volume = remapClamp(game.weather.rain.value, [0.1, 0.6], [0, 1]);
      },
    });
    this.register({
      group: 'wind',
      path: 'sounds/wind/13582-wind-in-forest-loop.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        item.volume = remapClamp(game.weather.wind.value, [0.3, 1], [0, 1]) ** 3 * 0.7;
      },
    });
    this.register({
      group: 'waves',
      path: 'sounds/waves/lake-waves.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        const halfSize = game.terrain.size / 2;
        const distanceToSide = Math.min(
          halfSize - Math.abs(game.player.position.x),
          halfSize - Math.abs(game.player.position.z),
        );
        item.volume = remapClamp(distanceToSide, [0, 40], [1, 0.1]) ** 2 * 0.7;
      },
    });
  }

  #registerFires(): void {
    const areas = getGame().world.areas;
    const ovens = [
      areas?.cookie?.references.items.get('spawner')?.[0]?.position,
      areas?.projects?.references.items.get('oven')?.[0]?.position,
    ].filter((position): position is THREE.Vector3 => position instanceof THREE.Vector3);
    if (ovens.length > 0) {
      this.register({
        group: 'ovenFire',
        path: 'sounds/fire/Mountain Audio - Fire Burning in a Wood Stove 1.mp3',
        autoplay: true,
        loop: true,
        volume: 0.8,
        positions: ovens,
        distanceFade: FIRE_FADE_DISTANCE,
      });
    }

    const campfire = areas?.lab?.references.items.get('fire')?.[0]?.position;
    if (campfire instanceof THREE.Vector3) {
      this.register({
        group: 'campfire',
        path: 'sounds/fire/Fire Burning.mp3',
        autoplay: true,
        loop: true,
        volume: 1,
        positions: [campfire],
        distanceFade: FIRE_FADE_DISTANCE,
      });
    }
  }

  #registerOneOffs(): void {
    this.register({
      group: 'discChange',
      path: 'sounds/jukebox/DVDPlayerChangeDisc_BW.49824.mp3',
      autoplay: false,
      loop: false,
      volume: 0.3,
    });
    this.register({ group: 'slide', path: 'sounds/mecanism/slide.mp3', autoplay: false, volume: 0.18 });
    this.register({
      group: 'click',
      path: 'sounds/mecanism/click.mp3',
      autoplay: false,
      volume: 0.25,
      onPlay: (item, isOpen = true) => {
        item.rate = isOpen ? 1 : 0.6;
      },
    });
    this.register({ group: 'assemble', path: 'sounds/mecanism/assemble.mp3', autoplay: false, volume: 0.3 });

    for (const group of HIT_GROUPS) {
      const volumeOf = HIT_VOLUME[group];
      for (const [path, baseVolume] of HIT_SOUNDS[group]) {
        this.register({
          group,
          path,
          autoplay: false,
          volume: baseVolume,
          antiSpam: DEFAULT_ANTI_SPAM,
          positions: new THREE.Vector3(),
          distanceFade: HIT_FADE_DISTANCE,
          onPlay: hitHandler(baseVolume, volumeOf),
        });
      }
    }
  }

  #bindMuteControls(): void {
    const { inputs } = getGame();
    inputs.addActions([MUTE_KEY]);
    inputs.events.on('mute', (action) => {
      if (action.active) this.mute.toggle();
    });
    window.addEventListener('blur', () => this.#setBackground(true));
    window.addEventListener('focus', () => this.#setBackground(false));
    document.addEventListener('visibilitychange', () => this.#setBackground(document.hidden || !document.hasFocus()));
  }

  #setBackground(isBackground: boolean): void {
    if (this.isBackground === isBackground) return;
    this.isBackground = isBackground;
    if (isBackground) {
      Howler.mute(true);
      this.playlist?.pause();
    } else {
      if (!this.mute.active) Howler.mute(false);
      this.playlist?.resume();
    }
    this.events.trigger('backgroundChange', isBackground);
  }

  update(): void {
    const { time } = getGame();
    this.#globalRate = time.scale / time.defaultScale;
    for (const group of this.groups.values()) {
      for (const item of group.items) this.#updateItem(item);
    }
  }

  #updateItem(item: AudioItem): void {
    item.onPlaying?.(item);
    const fade = item.positions && item.howl.playing() ? this.#spatialize(item, item.positions) : 1;
    item.applyMix(clamp(item.rate * this.#globalRate, RATE_RANGE.min, RATE_RANGE.max), item.volume * fade);
  }

  #spatialize(item: AudioItem, positions: readonly THREE.Vector3[]): number {
    const { view } = getGame();
    const closest = closestTo(positions, view.focusPoint.position);
    if (!closest) return 1;

    const relative = closest.position.clone().applyMatrix4(view.camera.matrixWorldInverse).normalize();
    relative.z *= CAMERA_DEPTH_SCALE;
    const fade = item.distanceFade ? remapClamp(closest.distance, [0, item.distanceFade], [1, 0]) : 1;
    if (fade > 0) item.howl.pos(relative.x, relative.y, relative.z);
    return fade;
  }
}
