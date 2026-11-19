import { Howler } from 'howler';

interface MusicStreamOptions {
  src: string;
  volume: number;
  needsGestureUnlock: boolean;
  onLoad: () => void;
  onLoadError: () => void;
  onEnd: () => void;
}

interface Mixer {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

const GESTURE_EVENTS = ['touchend', 'click', 'keydown'] as const;
const PLAYBACK_BLOCKED = 'NotAllowedError';

function isPlaybackBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === PLAYBACK_BLOCKED;
}

export class MusicStream {
  readonly #element = new Audio();
  readonly #options: MusicStreamOptions;
  #mixer: Mixer | null = null;
  #wantsPlay = false;
  #isWaitingForGesture = false;
  #isUnloaded = false;

  constructor(options: MusicStreamOptions) {
    this.#options = options;
    this.#element.preload = 'auto';
    this.#element.addEventListener('canplay', options.onLoad);
    this.#element.addEventListener('error', options.onLoadError);
    this.#element.addEventListener('ended', options.onEnd);
    if (options.needsGestureUnlock) this.#waitForGesture();
  }

  load(): void {
    if (this.#element.getAttribute('src') !== this.#options.src) this.#element.src = this.#options.src;
    this.#element.load();
  }

  play(): void {
    if (this.#isUnloaded) return;
    const mixer = this.#ensureMixer();
    if (!mixer) return;
    this.#wantsPlay = true;
    if (mixer.context.state !== 'running') this.#resumeContext(mixer.context);
    this.#element.play().catch((error: unknown) => {
      if (this.#wantsPlay && isPlaybackBlocked(error)) this.#waitForGesture();
    });
  }

  pause(): void {
    this.#wantsPlay = false;
    this.#element.pause();
  }

  stop(): void {
    this.pause();
    this.#element.currentTime = 0;
  }

  playing(): boolean {
    const isAudible = this.#mixer?.context.state === 'running';
    const element = this.#element;
    return isAudible && !element.paused && !element.ended && element.error === null;
  }

  unload(): void {
    this.#isUnloaded = true;
    this.pause();
    this.#stopWaitingForGesture();
    this.#mixer?.source.disconnect();
    this.#mixer?.gain.disconnect();
    this.#mixer = null;
    this.#element.removeAttribute('src');
    this.#element.load();
  }

  readonly #handleGesture = (): void => {
    this.#stopWaitingForGesture();
    if (this.#wantsPlay) {
      this.play();
      return;
    }
    if (this.#element.paused) this.load();
  };

  #resumeContext(context: AudioContext): void {
    this.#waitForGesture();
    context
      .resume()
      .then(() => {
        if (!this.#wantsPlay || this.#element.paused) return;
        this.#stopWaitingForGesture();
      })
      .catch(() => undefined);
  }

  #waitForGesture(): void {
    if (this.#isUnloaded || this.#isWaitingForGesture) return;
    this.#isWaitingForGesture = true;
    for (const name of GESTURE_EVENTS) document.addEventListener(name, this.#handleGesture, { capture: true });
  }

  #stopWaitingForGesture(): void {
    this.#isWaitingForGesture = false;
    for (const name of GESTURE_EVENTS) document.removeEventListener(name, this.#handleGesture, { capture: true });
  }

  #ensureMixer(): Mixer | null {
    if (this.#mixer) return this.#mixer;
    if (!Howler.usingWebAudio) return null;
    const { ctx: context, masterGain } = Howler;
    const gain = context.createGain();
    gain.gain.value = this.#options.volume;
    const source = context.createMediaElementSource(this.#element);
    source.connect(gain).connect(masterGain);
    this.#mixer = { context, source, gain };
    return this.#mixer;
  }
}
