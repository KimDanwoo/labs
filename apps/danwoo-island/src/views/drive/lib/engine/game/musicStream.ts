import { Howler } from 'howler';

export interface MusicStreamOptions {
  src: string;
  volume: number;
  needsGestureUnlock: boolean;
  onLoad: () => void;
  onLoadError: () => void;
  onEnd: () => void;
}

const GESTURE_EVENTS = ['touchend', 'click', 'keydown'] as const;

export class MusicStream {
  readonly #element = new Audio();
  readonly #options: MusicStreamOptions;
  #mixer: { source: MediaElementAudioSourceNode; gain: GainNode } | null = null;
  #isRouted = false;
  #isUnlocked: boolean;
  #isPlayPending = false;

  constructor(options: MusicStreamOptions) {
    this.#options = options;
    this.#isUnlocked = !options.needsGestureUnlock;
    this.#element.preload = 'auto';
    this.#element.addEventListener('canplay', options.onLoad);
    this.#element.addEventListener('error', options.onLoadError);
    this.#element.addEventListener('ended', options.onEnd);
    if (!this.#isUnlocked) {
      for (const name of GESTURE_EVENTS) document.addEventListener(name, this.#unlock, { capture: true });
    }
  }

  load(): void {
    if (this.#element.getAttribute('src') !== this.#options.src) this.#element.src = this.#options.src;
    this.#element.load();
  }

  play(): void {
    this.#routeThroughMixer();
    this.#isPlayPending = true;
    this.#element
      .play()
      .then(() => {
        this.#isPlayPending = false;
      })
      .catch(() => {
        this.#isPlayPending = !this.#isUnlocked;
      });
  }

  pause(): void {
    this.#isPlayPending = false;
    this.#element.pause();
  }

  stop(): void {
    this.pause();
    this.#element.currentTime = 0;
  }

  playing(): boolean {
    return !this.#element.paused && !this.#element.ended;
  }

  unload(): void {
    this.pause();
    this.#removeGestureListeners();
    this.#mixer?.source.disconnect();
    this.#mixer?.gain.disconnect();
    this.#mixer = null;
    this.#element.removeAttribute('src');
    this.#element.load();
  }

  readonly #unlock = (): void => {
    this.#isUnlocked = true;
    this.#removeGestureListeners();
    if (this.#isPlayPending) this.play();
    else this.load();
  };

  #removeGestureListeners(): void {
    for (const name of GESTURE_EVENTS) document.removeEventListener(name, this.#unlock, { capture: true });
  }

  #routeThroughMixer(): void {
    if (this.#isRouted) return;
    this.#isRouted = true;
    if (!Howler.usingWebAudio) {
      this.#element.volume = this.#options.volume;
      return;
    }
    const { ctx, masterGain } = Howler;
    const gain = ctx.createGain();
    gain.gain.value = this.#options.volume;
    const source = ctx.createMediaElementSource(this.#element);
    source.connect(gain).connect(masterGain);
    this.#mixer = { source, gain };
  }
}
