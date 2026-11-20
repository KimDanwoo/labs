import { MUSIC_STATUS } from '@views/walk/lib/music/musicSettings';
import { useMusicPlayer } from '@views/walk/model/hooks/music/useMusicPlayer';
import { useRef, useState } from 'react';

export function useMusicPanel(source: string, initialVolume: number, profile: string) {
  const { iframe, ...player } = useMusicPlayer(source, initialVolume);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleButton = useRef<HTMLButtonElement>(null);
  const duration = player.track?.duration ?? 0;
  const ordinal = player.tracks.findIndex((track) => track.id === player.track?.id);

  const collapse = () => {
    setIsExpanded(false);
    toggleButton.current?.focus();
  };

  return {
    player,
    iframe,
    source,
    profile,
    toggleButton,
    isExpanded,
    isReady: player.status === MUSIC_STATUS.ready,
    duration,
    position: Math.min(player.position, duration),
    isLast: ordinal >= player.tracks.length - 1,
    collapse,
    toggle: () => (isExpanded ? collapse() : setIsExpanded(true)),
  };
}

export type MusicPanel = ReturnType<typeof useMusicPanel>;
