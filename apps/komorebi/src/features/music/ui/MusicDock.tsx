'use client';

import { DANWOO_PROFILE, DEFAULT_MUSIC, type MusicPreferences } from '@features/music/lib/soundcloud';
import { readMusicPreferences, saveMusicPreferences } from '@features/music/model/hooks';
import { useState } from 'react';
import { MusicPlayer } from './MusicPlayer';

export function MusicDock() {
  const [hasOpened, setHasOpened] = useState(false);
  const [preferences, setPreferences] = useState<MusicPreferences>(DEFAULT_MUSIC);
  const [attempt, setAttempt] = useState(0);
  function connect() {
    setPreferences(readMusicPreferences());
    setHasOpened(true);
  }
  function reload(source: string) {
    const next = { ...readMusicPreferences(), source };
    saveMusicPreferences(next);
    setPreferences(next);
    setAttempt((value) => value + 1);
  }
  if (!hasOpened)
    return (
      <button className="music-launcher" onClick={connect} aria-label="DANWOO MP3 열기">
        <span aria-hidden="true">♫</span> DANWOO MP3 <small>음악과 함께 걷기</small>
      </button>
    );
  return (
    <MusicPlayer
      key={`${preferences.source}-${attempt}`}
      source={preferences.source}
      initialVolume={preferences.volume}
      onRetry={() => reload(preferences.source)}
      onSource={reload}
      onPowerOff={() => setHasOpened(false)}
      profile={DANWOO_PROFILE}
    />
  );
}
