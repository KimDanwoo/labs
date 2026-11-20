import type { JukeboxTrack } from '@views/drive/lib/engine/data/worldContent';
import {
  JukeboxStateStore,
  createAnnouncer,
  isRequestedSound,
  offsetIndex,
} from '@views/drive/lib/engine/game/jukebox/jukeboxState';
import type { JukeboxPlayerOptions, JukeboxState, MusicHost } from '@views/drive/lib/engine/game/jukebox/jukeboxTypes';
import { bindJukeboxWidget } from '@views/drive/lib/engine/game/jukebox/jukeboxWidget';
import {
  loadWidgetApi,
  mountWidgetFrame,
  trackApiUrl,
  type SoundCloudGlobal,
  type SoundCloudWidget,
  type WidgetFrame,
} from '@views/drive/lib/engine/game/jukebox/soundcloudWidget';

const VOLUME = 70;

export class JukeboxPlayer {
  readonly #store = new JukeboxStateStore();
  readonly events = this.#store.events;
  readonly tracks: readonly JukeboxTrack[];
  readonly #music: MusicHost;
  readonly #announce: (index: number | null) => void;
  readonly #loadApi: () => Promise<SoundCloudGlobal>;
  readonly #mountFrame: (trackId: number) => WidgetFrame;
  #widget: SoundCloudWidget | null = null;
  #preparing: Promise<void> | null = null;
  #requestedIndex: number | null = null;
  #wantsPlayback = false;

  constructor({
    tracks,
    music,
    announce,
    loadApi = loadWidgetApi,
    mountFrame = mountWidgetFrame,
  }: JukeboxPlayerOptions) {
    this.tracks = tracks;
    this.#music = music;
    this.#announce = createAnnouncer(tracks, announce);
    this.#loadApi = loadApi;
    this.#mountFrame = mountFrame;
    music.events.on('muteChange', () => this.#applyVolume());
    music.events.on('backgroundChange', (isBackground) => this.#handleBackground(isBackground));
  }

  get state(): JukeboxState {
    return this.#store.current;
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
      this.#store.set({ status: 'loading', trackIndex: index, progress: 0 });
      void this.prepare();
      return;
    }
    if (isSameTrack) this.#start();
    else this.#load(index);
  }

  toggle(): void {
    const { status, trackIndex } = this.#store.current;
    if (status === 'playing' || status === 'starting') {
      this.#wantsPlayback = false;
      this.#store.clearStartTimer();
      this.#widget?.pause();
      this.#store.set({ status: 'paused' });
      return;
    }
    this.select(trackIndex ?? 0);
  }

  next(): void {
    this.select(offsetIndex(this.#store.current.trackIndex, 1, this.tracks.length));
  }

  previous(): void {
    this.select(offsetIndex(this.#store.current.trackIndex, -1, this.tracks.length));
  }

  stop(): void {
    this.#wantsPlayback = false;
    this.#store.clearStartTimer();
    this.#widget?.pause();
    this.#store.set({ status: this.#widget ? 'ready' : 'idle', progress: 0 });
    this.#music.releaseMusic();
  }

  async #mount(): Promise<void> {
    const api = await this.#loadApi();
    const firstIndex = this.#requestedIndex ?? 0;
    const firstTrack = this.tracks[firstIndex];
    if (!firstTrack) throw new Error('Jukebox has no tracks');
    const frame = this.#mountFrame(firstTrack.id);
    await bindJukeboxWidget(api, frame, {
      onPlay: (soundId) => this.#handlePlay(soundId),
      onPause: (soundId) => this.#handlePause(soundId),
      onFinish: (soundId) => this.#handleFinish(soundId),
      onProgress: (soundId, relativePosition) => this.#handleProgress(soundId, relativePosition),
      onError: () => this.#fail(),
      onReady: (widget) => {
        if (!this.#widget) this.#handleReady(widget, firstIndex);
      },
    });
  }

  #handleReady(widget: SoundCloudWidget, loadedIndex: number): void {
    this.#widget = widget;
    this.#applyVolume();
    const requested = this.#requestedIndex;
    if (!this.#wantsPlayback || requested === null) {
      this.#requestedIndex ??= loadedIndex;
      this.#store.set({ status: 'ready' });
      return;
    }
    if (requested === loadedIndex) this.#start();
    else this.#load(requested);
  }

  #load(index: number): void {
    const track = this.tracks[index];
    if (!track || !this.#widget) return;
    this.#store.set({ status: 'starting', trackIndex: index, progress: 0 });
    this.#store.armStartTimer();
    this.#widget.load(trackApiUrl(track.id), {
      auto_play: true,
      callback: () => {
        if (this.#requestedIndex === index) this.#applyVolume();
      },
    });
  }

  #start(): void {
    this.#store.set({ status: 'starting', trackIndex: this.#requestedIndex });
    this.#store.armStartTimer();
    this.#widget?.play();
  }

  #handlePlay(soundId: number | undefined): void {
    if (!this.#wantsPlayback || this.#music.isBackground) {
      this.#widget?.pause();
      return;
    }
    if (!isRequestedSound(this.tracks, this.#requestedIndex, soundId)) return;
    this.#store.clearStartTimer();
    this.#store.set({ status: 'playing' });
    this.#announce(this.#store.current.trackIndex);
  }

  #handlePause(soundId: number | undefined): void {
    if (!isRequestedSound(this.tracks, this.#requestedIndex, soundId) || this.#store.current.status !== 'playing')
      return;
    this.#store.set({ status: 'paused' });
  }

  #handleFinish(soundId: number | undefined): void {
    if (this.#wantsPlayback && isRequestedSound(this.tracks, this.#requestedIndex, soundId)) this.next();
  }

  #handleProgress(soundId: number | undefined, progress: number | undefined): void {
    if (
      !isRequestedSound(this.tracks, this.#requestedIndex, soundId) ||
      typeof progress !== 'number' ||
      !Number.isFinite(progress)
    )
      return;
    this.#store.set({ progress });
  }

  #fail(): void {
    this.#wantsPlayback = false;
    this.#store.clearStartTimer();
    this.#store.set({ status: 'error' });
    this.#music.releaseMusic();
  }

  #handleBackground(isBackground: boolean): void {
    if (!this.#widget || !this.#wantsPlayback) return;
    if (isBackground) this.#widget.pause();
    else this.#start();
  }

  #applyVolume(): void {
    this.#widget?.setVolume(this.#music.mute.active ? 0 : VOLUME);
  }
}
