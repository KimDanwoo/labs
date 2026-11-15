import type { JukeboxTrack } from '../../data/worldContent';
import { type Audio, nowPlayingNotice } from '../audio';
import { Events } from '../events';
import type { Notifications } from '../notifications';
import {
  loadWidgetApi,
  mountWidgetFrame,
  type SoundCloudWidget,
  trackApiUrl,
  type WidgetProgress,
} from './soundcloudWidget';

export type JukeboxStatus = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'error';

export interface JukeboxState {
  readonly status: JukeboxStatus;
  readonly trackIndex: number | null;
  readonly progress: number;
}

interface JukeboxPlayerOptions {
  tracks: readonly JukeboxTrack[];
  audio: Audio;
  notifications: Notifications;
}

const VOLUME = 70;
const START_TIMEOUT_MS = 8000;
const NOTICE_DURATION = 5;

export class JukeboxPlayer {
  readonly events = new Events<{ change: [state: JukeboxState] }>();
  readonly tracks: readonly JukeboxTrack[];
  readonly #audio: Audio;
  readonly #notifications: Notifications;
  #widget: SoundCloudWidget | null = null;
  #preparing: Promise<void> | null = null;
  #loadedIndex: number | null = null;
  #pendingIndex: number | null = null;
  #announcedIndex: number | null = null;
  #wantsPlayback = false;
  #startTimer: ReturnType<typeof setTimeout> | null = null;
  #state: JukeboxState = { status: 'idle', trackIndex: null, progress: 0 };

  constructor({ tracks, audio, notifications }: JukeboxPlayerOptions) {
    this.tracks = tracks;
    this.#audio = audio;
    this.#notifications = notifications;
    audio.events.on('muteChange', () => this.#applyVolume());
    audio.events.on('backgroundChange', (isBackground) => this.#handleBackground(isBackground));
  }

  get state(): JukeboxState {
    return this.#state;
  }

  get isPlaying(): boolean {
    return this.#state.status === 'playing';
  }

  prepare(): Promise<void> {
    this.#preparing ??= this.#mount().catch((error: unknown) => {
      this.#preparing = null;
      this.#setState({ status: 'error' });
      reportError(error);
    });
    return this.#preparing;
  }

  select(index: number): void {
    if (!this.tracks[index]) return;
    this.#wantsPlayback = true;
    this.#audio.claimMusic();
    if (!this.#widget) {
      this.#pendingIndex = index;
      this.#setState({ status: 'loading', trackIndex: index, progress: 0 });
      void this.prepare();
      return;
    }
    if (index === this.#loadedIndex) {
      this.#start(index);
      return;
    }
    this.#load(index);
  }

  toggle(): void {
    if (this.#state.status === 'playing' || this.#state.status === 'starting') {
      this.#wantsPlayback = false;
      this.#widget?.pause();
      return;
    }
    this.select(this.#state.trackIndex ?? 0);
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
    this.#audio.releaseMusic();
  }

  async #mount(): Promise<void> {
    const api = await loadWidgetApi();
    const firstIndex = this.#pendingIndex ?? 0;
    const firstTrack = this.tracks[firstIndex];
    if (!firstTrack) throw new Error('Jukebox has no tracks');
    const widget = api.Widget(mountWidgetFrame(firstTrack.id));
    const { Events: WIDGET_EVENTS } = api.Widget;
    const bind = (name: string, handler: (payload?: WidgetProgress) => void): void => {
      const event = WIDGET_EVENTS[name];
      if (event) widget.bind(event, handler);
    };
    bind('READY', () => this.#handleReady(widget, firstIndex));
    bind('PLAY', () => this.#handlePlay());
    bind('PAUSE', () => this.#handlePause());
    bind('FINISH', () => this.next());
    bind('PLAY_PROGRESS', (payload) => this.#handleProgress(payload));
    bind('ERROR', () => this.#handleError());
  }

  #handleReady(widget: SoundCloudWidget, firstIndex: number): void {
    if (this.#widget) return;
    this.#widget = widget;
    this.#loadedIndex = firstIndex;
    this.#applyVolume();
    const pending = this.#pendingIndex;
    this.#pendingIndex = null;
    if (pending === null) {
      this.#setState({ status: 'ready', trackIndex: this.#state.trackIndex ?? firstIndex });
      return;
    }
    this.select(pending);
  }

  #load(index: number): void {
    const track = this.tracks[index];
    if (!track || !this.#widget) return;
    this.#loadedIndex = index;
    this.#setState({ status: 'starting', trackIndex: index, progress: 0 });
    this.#armStartTimer();
    this.#widget.load(trackApiUrl(track.id), {
      auto_play: true,
      callback: () => {
        if (this.#loadedIndex === index) this.#applyVolume();
      },
    });
  }

  #start(index: number): void {
    this.#setState({ status: 'starting', trackIndex: index });
    this.#armStartTimer();
    this.#widget?.play();
  }

  #handlePlay(): void {
    this.#clearStartTimer();
    if (!this.#wantsPlayback || this.#audio.isBackground) {
      this.#widget?.pause();
      return;
    }
    this.#setState({ status: 'playing' });
    this.#announce();
  }

  #handlePause(): void {
    const { status } = this.#state;
    if (status === 'starting' || status === 'ready') return;
    this.#setState({ status: 'paused' });
  }

  #handleProgress(payload?: WidgetProgress): void {
    const progress = payload?.relativePosition;
    if (typeof progress === 'number' && Number.isFinite(progress)) this.#setState({ progress });
  }

  #handleError(): void {
    this.#clearStartTimer();
    this.#setState({ status: 'error' });
  }

  #handleBackground(isBackground: boolean): void {
    if (!this.#widget || !this.#wantsPlayback) return;
    if (isBackground) {
      this.#widget.pause();
      return;
    }
    if (this.#state.trackIndex !== null) this.#start(this.#state.trackIndex);
  }

  #announce(): void {
    const index = this.#state.trackIndex;
    if (index === null || index === this.#announcedIndex) return;
    this.#announcedIndex = index;
    const track = this.tracks[index];
    if (track) this.#notifications.show(nowPlayingNotice(track.title), { type: 'song', duration: NOTICE_DURATION });
  }

  #applyVolume(): void {
    this.#widget?.setVolume(this.#audio.mute.active ? 0 : VOLUME);
  }

  #armStartTimer(): void {
    this.#clearStartTimer();
    this.#startTimer = setTimeout(() => {
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
