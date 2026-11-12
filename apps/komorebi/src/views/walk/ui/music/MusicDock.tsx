'use client';

import type { JSX } from 'react';
import { DANWOO_PROFILE, DEFAULT_MUSIC } from '../../lib/music/soundcloud';
import { MusicPlayer } from './MusicPlayer';

export function MusicDock(): JSX.Element {
  return <MusicPlayer source={DANWOO_PROFILE} initialVolume={DEFAULT_MUSIC.volume} profile={DANWOO_PROFILE} />;
}
