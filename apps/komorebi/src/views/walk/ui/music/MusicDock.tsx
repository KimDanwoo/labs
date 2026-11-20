'use client';

import { DANWOO_PROFILE, DEFAULT_MUSIC } from '@views/walk/lib/music/musicSettings';
import { MusicPlayer } from '@views/walk/ui/music/MusicPlayer';
import type { JSX } from 'react';

export function MusicDock(): JSX.Element {
  return <MusicPlayer source={DANWOO_PROFILE} initialVolume={DEFAULT_MUSIC.volume} profile={DANWOO_PROFILE} />;
}
