'use client';

import { PLAYER_SCREEN, type PlayerScreen } from '@entities/track';
import { cn } from '@shared/lib/cn';
import { PlaybackProvider } from './PlaybackProvider';

import { usePlayerEngine } from '../model/hooks/usePlayerEngine';
import { Archive } from './archive/Archive';
import { PlayerHeader } from './PlayerHeader';
import { Playlist } from './playlist/Playlist';
import { Stage } from './stage/Stage';
import { Transport } from './transport/Transport';

interface PlayerViewProps {
  initialTrackId?: number;
  initialScreen?: PlayerScreen;
}

export function PlayerView({ initialTrackId, initialScreen }: PlayerViewProps) {
  const { playback, engineMode, screen } = usePlayerEngine(initialTrackId, initialScreen);
  const isQueue = screen === PLAYER_SCREEN.queue;

  return (
    <PlaybackProvider value={playback}>
      <div
        data-engine-mode={engineMode}
        className={cn(
          'relative z-10 grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto]',
          isQueue ? 'player:grid-cols-[var(--spacing-library)_minmax(0,1fr)]' : 'player:grid-cols-[minmax(0,1fr)]',
        )}
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
