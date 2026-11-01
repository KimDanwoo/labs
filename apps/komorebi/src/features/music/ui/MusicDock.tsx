'use client';

import { DANWOO_PROFILE, DEFAULT_MUSIC } from '@features/music/lib/soundcloud';
import { useState } from 'react';
import { MusicPlayer } from './MusicPlayer';

export function MusicDock() {
  const [hasOpened, setHasOpened] = useState(true);
  const [attempt, setAttempt] = useState(0);
  if (!hasOpened)
    return (
      <button className="music-launcher" onClick={() => setHasOpened(true)} aria-label="주머니 속 MP3 켜기">
        <span aria-hidden="true">♫</span> MP3 <small>담아 둔 노래 듣기</small>
      </button>
    );
  return (
    <MusicPlayer
      key={attempt}
      source={DANWOO_PROFILE}
      initialVolume={DEFAULT_MUSIC.volume}
      onRetry={() => setAttempt((value) => value + 1)}
      onPowerOff={() => setHasOpened(false)}
      profile={DANWOO_PROFILE}
    />
  );
}
