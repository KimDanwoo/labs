import { useLayoutEffect, useRef, useState } from 'react';
import {
  type MusicPreferences,
  type MusicStatus,
  type MusicTrack,
  type MusicWidget,
  DEFAULT_MUSIC,
  MUSIC_STATUS,
  MUSIC_STORAGE_KEY,
  bindMusicWidget,
  loadMusicApi,
  parseMusicPreferences,
} from '../../lib/soundcloud';

export function useMusicPlayer(source: string, initialVolume: number) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const widget = useRef<MusicWidget | null>(null);
  const [status, setStatus] = useState<MusicStatus>(MUSIC_STATUS.loading);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [position, setPosition] = useState(0);
  const volumeRef = useRef(initialVolume);
  const previousSecond = useRef(-1);
  useLayoutEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      if (!cancelled) setStatus(MUSIC_STATUS.error);
    }, 25000);
    void loadMusicApi()
      .then((api) => {
        if (cancelled || !iframe.current) return;
        const savedVolume = readMusicPreferences().volume;
        volumeRef.current = savedVolume;
        setVolume(savedVolume);
        const player = api.Widget(iframe.current);
        widget.current = player;
        cleanup = bindMusicWidget(
          player,
          api.Widget.Events,
          {
            ready: (sounds) => {
              window.clearTimeout(timer);
              setTracks(sounds);
              setStatus(MUSIC_STATUS.ready);
            },
            playing: setIsPlaying,
            track: (next) => {
              setIndex(next);
              setPosition(0);
              previousSecond.current = -1;
            },
            progress: (next) => {
              const second = Math.floor(next / 1000);
              if (second === previousSecond.current) return;
              previousSecond.current = second;
              setPosition(next);
            },
            error: () => {
              window.clearTimeout(timer);
              setStatus(MUSIC_STATUS.error);
            },
          },
          volumeRef.current,
        );
      })
      .catch(() => {
        if (!cancelled) {
          window.clearTimeout(timer);
          setStatus(MUSIC_STATUS.error);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanup?.();
      widget.current = null;
    };
  }, [source]);
  const track = tracks.find((track) => track.index === index) ?? tracks[0];
  const choose = (next: number) => {
    if (status === MUSIC_STATUS.ready) widget.current?.skip(next);
  };
  const changeVolume = (next: number) => {
    const bounded = Math.max(0, Math.min(100, next));
    volumeRef.current = bounded;
    setVolume(bounded);
    widget.current?.setVolume(bounded);
    saveMusicPreferences({ volume: bounded, source });
  };
  return {
    iframe,
    status,
    tracks,
    track,
    isPlaying,
    position,
    volume,
    toggle: () => {
      if (isPlaying) widget.current?.pause();
      else widget.current?.play();
    },
    pause: () => widget.current?.pause(),
    next: () => widget.current?.next(),
    prev: () => widget.current?.prev(),
    choose,
    changeVolume,
    seek: (next: number) => {
      const bounded = Math.max(0, Math.min(track?.duration ?? 0, next));
      widget.current?.seekTo(bounded);
      setPosition(bounded);
    },
  };
}
export function readMusicPreferences(): MusicPreferences {
  try {
    return parseMusicPreferences(localStorage.getItem(MUSIC_STORAGE_KEY));
  } catch {
    return DEFAULT_MUSIC;
  }
}
export function saveMusicPreferences(next: MusicPreferences) {
  try {
    localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Playback still works without preferences. */
  }
}
