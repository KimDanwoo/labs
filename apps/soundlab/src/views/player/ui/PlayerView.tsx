'use client';

import {
  currentIndexAtom,
  engineModeAtom,
  isPlayingAtom,
  PlaybackProvider,
  PLAYER_SCREEN,
  playerScreenAtom,
  TRACKS,
  useKeyboard,
  useMediaSession,
  usePlayback,
  useTrackUrl,
  useWaveform,
  type PlayerScreen,
} from '@entities/track';
import { useAtomValue } from 'jotai';
import { Archive } from './archive/Archive';
import { PlayerHeader } from './PlayerHeader';
import { Playlist } from './playlist/Playlist';
import { Stage } from './stage/Stage';
import { Transport } from './transport/Transport';

type PlayerViewProps = {
  /** 공유 링크(/t/[id])로 들어왔을 때 시작할 곡. 없으면 첫 곡. */
  initialTrackId?: number;
  /** 진입 화면. /t/[id]/queue로 들어오면 재생목록부터 보여준다. */
  initialScreen?: PlayerScreen;
};

export function PlayerView({ initialTrackId, initialScreen }: PlayerViewProps) {
  useTrackUrl(TRACKS, initialTrackId, initialScreen);

  const index = useAtomValue(currentIndexAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const engineMode = useAtomValue(engineModeAtom);
  const screen = useAtomValue(playerScreenAtom);

  const playback = usePlayback(TRACKS, initialTrackId);
  useWaveform(TRACKS[index], TRACKS[(index + 1) % TRACKS.length], isPlaying);
  useKeyboard(playback);
  useMediaSession(TRACKS[index], isPlaying, playback);

  const isQueue = screen === PLAYER_SCREEN.queue;

  return (
    <PlaybackProvider value={playback}>
      <div
        data-engine-mode={engineMode}
        className={`relative z-10 grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] ${
          isQueue ? 'player:grid-cols-[var(--spacing-library)_minmax(0,1fr)]' : 'player:grid-cols-[minmax(0,1fr)]'
        }`}
      >
        <div className="col-span-full">
          <PlayerHeader />
        </div>
        {screen === PLAYER_SCREEN.archive ? (
          <Archive />
        ) : (
          <>
            {isQueue ? <Playlist /> : null}
            <Stage />
          </>
        )}
        <Transport />
      </div>
    </PlaybackProvider>
  );
}
