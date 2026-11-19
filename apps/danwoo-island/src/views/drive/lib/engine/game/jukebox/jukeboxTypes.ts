import type { JukeboxTrack } from '../../data/worldContent';
import type { Events } from '../events';
import type { SoundCloudGlobal, WidgetFrame } from './soundcloudWidget';

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
