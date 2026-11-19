import gsap from 'gsap';
import { Howl, Howler } from 'howler';
import * as THREE from 'three/webgpu';

import { worldAsset } from '../../../config/worldAsset';
import { WORLD_CONFIG } from '../worldConfig';
import { registerAmbients } from './ambientSounds';
import {
  CAMERA_DEPTH_SCALE,
  IS_IOS,
  MAX_PARALLEL_LOADS,
  MUTE_KEY,
  type MusicOwner,
  RATE_RANGE,
  SONGS,
  SONG_NOTICE_DURATION,
  SONG_VOLUME,
  closestTo,
  nowPlayingNotice,
  scheduleIdle,
} from './audioConfig';
import { AudioGroup, AudioItem, type SoundHost, type SoundOptions } from './audioItem';
import { AudioMute } from './audioMute';
import { Events } from './events';
import { getGame } from './gameContext';
import { MusicStream } from './musicStream';
import { registerOneOffs } from './oneOffSounds';
import { Playlist } from './playlist';
import { TICK_ORDER } from './tickOrder';
import { clamp, remapClamp } from './utilities/maths';

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
  readonly #soundHost: SoundHost = {
    isInitiated: () => this.initiated,
    elapsed: () => getGame().ticker.elapsed,
    createPlayer: (options) => new Howl(options),
  };

  constructor() {
    const game = getGame();
    this.mute = new AudioMute((isMuted) => this.events.trigger('muteChange', isMuted));
    this.#bindMuteControls();
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.audio);
  }

  init(): void {
    registerAmbients(this);
    registerOneOffs(this);
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
    const item = new AudioItem(options, group, this.#soundHost);
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
    this.playlist ??= new Playlist(SONGS, {
      canPlay: () => this.initiated && WORLD_CONFIG.music && this.musicOwner === 'island' && !this.isBackground,
      createStream: (path, handlers) =>
        new MusicStream({ src: worldAsset(path), volume: SONG_VOLUME, needsGestureUnlock: IS_IOS, ...handlers }),
      delay: (seconds, callback) => gsap.delayedCall(seconds, callback),
      playDiscChange: () => this.groups.get('discChange')?.play(),
      announce: (songName) =>
        getGame().notifications.show(nowPlayingNotice(songName), { type: 'song', duration: SONG_NOTICE_DURATION }),
      now: () => Date.now(),
    });
    return this.playlist;
  }

  #startPlaylist(): void {
    this.#ensurePlaylist().resume();
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
