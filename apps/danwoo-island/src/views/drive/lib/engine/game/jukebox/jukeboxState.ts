import type { JukeboxTrack } from '@views/drive/lib/engine/data/worldContent';
import { Events } from '@views/drive/lib/engine/game/events';
import type { JukeboxState } from '@views/drive/lib/engine/game/jukebox/jukeboxTypes';

const START_TIMEOUT_MS = 8000;

export class JukeboxStateStore {
  readonly events = new Events<{ change: [state: JukeboxState] }>();
  #state: JukeboxState = { status: 'idle', trackIndex: null, progress: 0 };
  #startTimer: ReturnType<typeof setTimeout> | null = null;

  get current(): JukeboxState {
    return this.#state;
  }

  set(patch: Partial<JukeboxState>): void {
    this.#state = { ...this.#state, ...patch };
    this.events.trigger('change', this.#state);
  }

  armStartTimer(): void {
    this.clearStartTimer();
    this.#startTimer = setTimeout(() => {
      this.#startTimer = null;
      if (this.#state.status === 'starting') this.set({ status: 'paused' });
    }, START_TIMEOUT_MS);
  }

  clearStartTimer(): void {
    if (this.#startTimer !== null) clearTimeout(this.#startTimer);
    this.#startTimer = null;
  }
}

export function offsetIndex(current: number | null, offset: number, count: number): number {
  return ((current ?? 0) + offset + count) % count;
}

export function isRequestedSound(
  tracks: readonly JukeboxTrack[],
  requestedIndex: number | null,
  soundId: number | undefined,
): boolean {
  if (soundId === undefined || requestedIndex === null) return true;
  return tracks[requestedIndex]?.id === soundId;
}

export function createAnnouncer(tracks: readonly JukeboxTrack[], announce: (title: string) => void) {
  let announcedIndex: number | null = null;
  return (index: number | null): void => {
    if (index === null || index === announcedIndex) return;
    announcedIndex = index;
    const track = tracks[index];
    if (track) announce(track.title);
  };
}
