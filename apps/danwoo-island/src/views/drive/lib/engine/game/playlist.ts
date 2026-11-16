export interface SongStream {
  load(): void;
  play(): void;
  pause(): void;
  stop(): void;
  playing(): boolean;
  unload(): void;
}

export interface SongStreamHandlers {
  onLoad: () => void;
  onLoadError: () => void;
  onEnd: () => void;
}

export interface Cancelable {
  kill(): void;
}

export interface PlaylistHost {
  canPlay: () => boolean;
  createStream: (path: string, handlers: SongStreamHandlers) => SongStream;
  delay: (seconds: number, callback: () => void) => Cancelable;
  playDiscChange: () => void;
  announce: (songName: string) => void;
  now: () => number;
}

export interface SongEntry {
  path: string;
  name: string;
}

type SongLoadState = 'idle' | 'loading' | 'loaded' | 'failed';

interface Song extends SongEntry {
  sound: SongStream;
  loadState: SongLoadState;
  loadRetries: number;
  retryCall: Cancelable | null;
}

interface SoundLoadHandlers {
  onLoad: (sound: SongStream) => void;
  onLoadError: (sound: SongStream) => void;
}

const SONG_ROTATION_MS = 3 * 60 * 1000;
const SONG_SWITCH_DELAY = 1;
const SONG_LOAD_RETRY = { delay: 3, attempts: 3 } as const;

export class Playlist {
  readonly songs: Song[];
  current: Song | null = null;
  readonly #host: PlaylistHost;
  #index: number;
  #switchCall: Cancelable | null = null;

  constructor(entries: readonly SongEntry[], host: PlaylistHost) {
    this.#host = host;
    this.songs = entries.map(({ path, name }) => {
      const song: Song = {
        path,
        name,
        loadState: 'idle',
        loadRetries: 0,
        retryCall: null,
        sound: this.#createSound(
          path,
          this.#loadHandlers(() => song),
        ),
      };
      return song;
    });
    this.#index = Math.floor(host.now() / SONG_ROTATION_MS) % this.songs.length;
  }

  resume(): void {
    if (!this.#host.canPlay() || this.#switchCall || this.current?.sound.playing()) return;
    this.#renewRetries();
    this.#startCurrent();
  }

  pause(): void {
    this.#switchCall?.kill();
    this.#switchCall = null;
    this.current?.sound.pause();
  }

  next(): void {
    if (this.#switchCall || !this.#host.canPlay()) return;
    this.#host.playDiscChange();
    this.current?.sound.stop();
    this.#switchCall = this.#host.delay(SONG_SWITCH_DELAY, () => {
      this.#switchCall = null;
      if (!this.#host.canPlay()) return;
      this.#index = (this.#index + 1) % this.songs.length;
      this.#renewRetries();
      const song = this.#startCurrent();
      this.#host.announce(song.name);
    });
  }

  preload(): void {
    const song = this.songs[this.#index];
    if (song) this.#load(song);
  }

  #load(song: Song): void {
    if (song.loadState === 'failed') this.#rebuild(song);
    if (song.loadState !== 'idle') return;
    song.loadState = 'loading';
    song.sound.load();
  }

  #createSound(path: string, handlers: SoundLoadHandlers): SongStream {
    const sound: SongStream = this.#host.createStream(path, {
      onLoad: () => handlers.onLoad(sound),
      onLoadError: () => handlers.onLoadError(sound),
      onEnd: () => this.next(),
    });
    return sound;
  }

  #loadHandlers(songOf: () => Song): SoundLoadHandlers {
    return {
      onLoad: (sound) => this.#handleLoaded(songOf(), sound),
      onLoadError: (sound) => this.#handleLoadError(songOf(), sound),
    };
  }

  #rebuild(song: Song): void {
    song.retryCall?.kill();
    song.retryCall = null;
    song.sound.unload();
    song.sound = this.#createSound(
      song.path,
      this.#loadHandlers(() => song),
    );
    song.loadState = 'idle';
  }

  #handleLoaded(song: Song, sound: SongStream): void {
    if (song.sound !== sound) return;
    song.loadState = 'loaded';
    song.loadRetries = 0;
  }

  #handleLoadError(song: Song, sound: SongStream): void {
    if (song.sound !== sound || song.retryCall) return;
    song.loadState = 'failed';
    if (song.loadRetries >= SONG_LOAD_RETRY.attempts) return;
    song.loadRetries += 1;
    song.retryCall = this.#host.delay(SONG_LOAD_RETRY.delay, () => {
      song.retryCall = null;
      if (song.sound !== sound || song.loadState !== 'failed') return;
      const shouldPlay = this.current === song && this.#host.canPlay();
      if (shouldPlay) this.#startCurrent();
      else this.#load(song);
    });
  }

  #renewRetries(): void {
    const song = this.songs[this.#index];
    if (song?.loadState === 'failed') song.loadRetries = 0;
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
