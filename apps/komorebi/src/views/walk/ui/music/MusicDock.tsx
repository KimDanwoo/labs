'use client';

import { useState } from 'react';
import { DANWOO_PROFILE, DEFAULT_MUSIC } from '../../lib/music/soundcloud';
import { MusicPlayer } from './MusicPlayer';

export function MusicDock() {
  const [attempt, setAttempt] = useState(0);
  return (
    <MusicPlayer
      key={attempt}
      source={DANWOO_PROFILE}
      initialVolume={DEFAULT_MUSIC.volume}
      onRetry={() => setAttempt((value) => value + 1)}
      profile={DANWOO_PROFILE}
    />
  );
}
