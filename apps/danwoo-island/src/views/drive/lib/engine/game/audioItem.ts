import type { HowlOptions } from 'howler';
import type * as THREE from 'three/webgpu';

import { worldAsset } from '../../../config/worldAsset';

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

export interface SoundPlayer {
  once(event: 'load' | 'loaderror', callback: () => void): unknown;
  load(): unknown;
  play(): unknown;
  playing(): boolean;
  rate(rate: number): unknown;
  volume(volume: number): unknown;
  mute(isMuted: boolean): unknown;
  pos(x: number, y: number, z: number): unknown;
}

export interface SoundHost {
  isInitiated: () => boolean;
  elapsed: () => number;
  createPlayer: (options: HowlOptions) => SoundPlayer;
}

interface VectorLike {
  x: number;
  y: number;
  z: number;
}

const DEFAULT_VOLUME = 0.5;
export const DEFAULT_ANTI_SPAM = 0.1;
const SOUND_POOL = 2;
const AUDIBLE_VOLUME = 0.01;

export function isVectorLike(value: unknown): value is VectorLike {
  return typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'z' in value;
}

export function moveSoundTo(item: AudioItem, position: unknown): void {
  if (isVectorLike(position)) item.firstPosition().copy(position);
}

function toPositions(positions: SoundOptions['positions']): THREE.Vector3[] | null {
  if (!positions) return null;
  return Array.isArray(positions) ? positions : [positions];
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
  readonly howl: SoundPlayer;
  readonly positions: THREE.Vector3[] | null;
  readonly distanceFade: number | null;
  readonly autoplay: boolean;
  readonly id: number;
  rate: number;
  volume: number;
  playing: boolean;
  readonly #group: AudioGroup;
  readonly #host: SoundHost;
  readonly #antiSpam: number;
  readonly #onPlay: SoundHandler | null;
  readonly onPlaying: ((item: AudioItem) => void) | null;
  #loading: Promise<void> | null = null;
  readonly isEager: boolean;
  #lastPlay = -Infinity;
  #appliedRate = Number.NaN;
  #appliedVolume = Number.NaN;

  constructor(options: SoundOptions, group: AudioGroup, host: SoundHost) {
    const isInitiated = host.isInitiated();
    const volume = options.volume ?? DEFAULT_VOLUME;
    const isPlaying = isInitiated && (options.autoplay ?? false);
    this.#group = group;
    this.#host = host;
    this.id = group.items.length;
    this.howl = host.createPlayer({
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
    if (!this.#host.isInitiated()) return;
    void this.load();
    if (this.#antiSpam && this.#host.elapsed() - this.#lastPlay < this.#antiSpam) return;

    this.#onPlay?.(this, ...args);
    this.howl.play();
    this.#lastPlay = this.#host.elapsed();
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
