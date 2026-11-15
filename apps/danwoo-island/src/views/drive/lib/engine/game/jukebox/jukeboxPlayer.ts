import type { JukeboxTrack } from '../../data/worldContent';
import { Events } from '../events';
import {
  loadWidgetApi,
  mountWidgetFrame,
  type SoundCloudGlobal,
  type SoundCloudWidget,
  trackApiUrl,
  type WidgetEvent,
  type WidgetFrame,
  type WidgetPayload,
} from './soundcloudWidget';

export type JukeboxStatus = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'error';

export interface JukeboxState {
  readonly status: JukeboxStatus;
  readonly trackIndex: number | null;
  readonly progress: number;
}

export interface MusicHost {
  readonly isBackground: boolean;
  readonly mute: { readonly active: boolean };
  readonly events: Events<{ muteChange: [isMuted: boolean]; backgroundChange: [isBackground: boolean] }>;
  claimMusic(): void;
  releaseMusic(): void;
}

export interface JukeboxPlayerOptions {
  tracks: readonly JukeboxTrack[];
  music: MusicHost;
  announce: (title: string) => void;
  loadApi?: () => Promise<SoundCloudGlobal>;
  mountFrame?: (trackId: number) => WidgetFrame;
}

const VOLUME = 70;
const START_TIMEOUT_MS = 8000;
const READY_TIMEOUT_MS = 12_000;

export class JukeboxPlayer {
  readonly events = new Events<{ change: [state: JukeboxState] }>();
  readonly tracks: readonly JukeboxTrack[];
  readonly #music: MusicHost;
  readonly #announce: (title: string) => void;
  readonly #loadApi: () => Promise<SoundCloudGlobal>;
  readonly #mountFrame: (trackId: number) => WidgetFrame;
  #widget: SoundCloudWidget | null = null;
  #preparing: Promise<void> | null = null;
  #requestedIndex: number | null = null;
  #announcedIndex: number | null = null;
  #wantsPlayback = false;
  #startTimer: ReturnType<typeof setTimeout> | null = null;
  #state: JukeboxState = { status: 'idle', trackIndex: null, progress: 0 };

  constructor({
    tracks,
    music,
    announce,
    loadApi = loadWidgetApi,
    mountFrame = mountWidgetFrame,
  }: JukeboxPlayerOptions) {
    this.tracks = tracks;
    this.#music = music;
    this.#announce = announce;
    this.#loadApi = loadApi;
    this.#mountFrame = mountFrame;
    music.events.on('muteChange', () => this.#applyVolume());
    music.events.on('backgroundChange', (isBackground) => this.#handleBackground(isBackground));
  }

  get state(): JukeboxState {
    return this.#state;
  }

  prepare(): Promise<void> {
    this.#preparing ??= this.#mount().catch((error: unknown) => {
      this.#preparing = null;
      this.#fail();
      reportError(error);
    });
    return this.#preparing;
  }

  select(index: number): void {
    if (!this.tracks[index]) return;
    this.#wantsPlayback = true;
    this.#music.claimMusic();
    const isSameTrack = index === this.#requestedIndex;
    this.#requestedIndex = index;
    if (!this.#widget) {
      this.#setState({ status: 'loading', trackIndex: index, progress: 0 });
      void this.prepare();
      return;
    }
    if (isSameTrack) this.#start();
    else this.#load(index);
  }

  toggle(): void {
    const { status, trackIndex } = this.#state;
    if (status === 'playing' || status === 'starting') {
      this.#wantsPlayback = false;
      this.#clearStartTimer();
      this.#widget?.pause();
      this.#setState({ status: 'paused' });
      return;
    }
    this.select(trackIndex ?? 0);
  }

  next(): void {
    this.select(this.#offsetIndex(1));
  }

  previous(): void {
    this.select(this.#offsetIndex(-1));
  }

  stop(): void {
    this.#wantsPlayback = false;
    this.#clearStartTimer();
    this.#widget?.pause();
    this.#setState({ status: this.#widget ? 'ready' : 'idle', progress: 0 });
    this.#music.releaseMusic();
  }

  async #mount(): Promise<void> {
    const api = await this.#loadApi();
    const firstIndex = this.#requestedIndex ?? 0;
    const firstTrack = this.tracks[firstIndex];
    if (!firstTrack) throw new Error('Jukebox has no tracks');
    const frame = this.#mountFrame(firstTrack.id);
    const widget = api.Widget(frame);
    const bind = (name: WidgetEvent, handler: (payload: WidgetPayload) => void): void => {
      const event = api.Widget.Events[name];
      if (event) widget.bind(event, (payload) => handler(payload ?? {}));
    };
    bind('PLAY', ({ soundId }) => this.#handlePlay(soundId));
    bind('PAUSE', ({ soundId }) => this.#handlePause(soundId));
    bind('FINISH', ({ soundId }) => this.#handleFinish(soundId));
    bind('PLAY_PROGRESS', ({ soundId, relativePosition }) => this.#handleProgress(soundId, relativePosition));
    bind('ERROR', () => this.#fail());
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        frame.remove();
        reject(new Error('SoundCloud widget was not ready in time'));
      }, READY_TIMEOUT_MS);
      bind('READY', () => {
        clearTimeout(timer);
        if (!this.#widget) this.#handleReady(widget, firstIndex);
        resolve();
      });
    });
  }

  #handleReady(widget: SoundCloudWidget, loadedIndex: number): void {
    this.#widget = widget;
    this.#applyVolume();
    const requested = this.#requestedIndex;
    if (!this.#wantsPlayback || requested === null) {
      this.#requestedIndex ??= loadedIndex;
      this.#setState({ status: 'ready' });
      return;
    }
    if (requested === loadedIndex) this.#start();
    else this.#load(requested);
  }

  #load(index: number): void {
    const track = this.tracks[index];
    if (!track || !this.#widget) return;
    this.#setState({ status: 'starting', trackIndex: index, progress: 0 });
    this.#armStartTimer();
    this.#widget.load(trackApiUrl(track.id), {
      auto_play: true,
      callback: () => {
        if (this.#requestedIndex === index) this.#applyVolume();
      },
    });
  }

  #start(): void {
    this.#setState({ status: 'starting', trackIndex: this.#requestedIndex });
    this.#armStartTimer();
    this.#widget?.play();
  }

  #isRequested(soundId: number | undefined): boolean {
    if (soundId === undefined || this.#requestedIndex === null) return true;
    return this.tracks[this.#requestedIndex]?.id === soundId;
  }

  #handlePlay(soundId: number | undefined): void {
    if (!this.#wantsPlayback || this.#music.isBackground) {
      this.#widget?.pause();
      return;
    }
    if (!this.#isRequested(soundId)) return;
    this.#clearStartTimer();
    this.#setState({ status: 'playing' });
    this.#announceCurrent();
  }

  #handlePause(soundId: number | undefined): void {
    if (!this.#isRequested(soundId) || this.#state.status !== 'playing') return;
    this.#setState({ status: 'paused' });
  }

  #handleFinish(soundId: number | undefined): void {
    if (this.#wantsPlayback && this.#isRequested(soundId)) this.next();
  }

  #handleProgress(soundId: number | undefined, progress: number | undefined): void {
    if (!this.#isRequested(soundId) || typeof progress !== 'number' || !Number.isFinite(progress)) return;
    this.#setState({ progress });
  }

  #fail(): void {
    this.#wantsPlayback = false;
    this.#clearStartTimer();
    this.#setState({ status: 'error' });
    this.#music.releaseMusic();
  }

  #handleBackground(isBackground: boolean): void {
    if (!this.#widget || !this.#wantsPlayback) return;
    if (isBackground) this.#widget.pause();
    else this.#start();
  }

  #announceCurrent(): void {
    const index = this.#state.trackIndex;
    if (index === null || index === this.#announcedIndex) return;
    this.#announcedIndex = index;
    const track = this.tracks[index];
    if (track) this.#announce(track.title);
  }

  #applyVolume(): void {
    this.#widget?.setVolume(this.#music.mute.active ? 0 : VOLUME);
  }

  #armStartTimer(): void {
    this.#clearStartTimer();
    this.#startTimer = setTimeout(() => {
      this.#startTimer = null;
      if (this.#state.status === 'starting') this.#setState({ status: 'paused' });
    }, START_TIMEOUT_MS);
  }

  #clearStartTimer(): void {
    if (this.#startTimer !== null) clearTimeout(this.#startTimer);
    this.#startTimer = null;
  }

  #offsetIndex(offset: number): number {
    const count = this.tracks.length;
    const current = this.#state.trackIndex ?? 0;
    return (current + offset + count) % count;
  }

  #setState(patch: Partial<JukeboxState>): void {
    this.#state = { ...this.#state, ...patch };
    this.events.trigger('change', this.#state);
  }
}
