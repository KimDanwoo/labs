import {
  currentIndexAtom,
  isPlayingAtom,
  PLAYER_SCREEN,
  playerPath,
  playerScreenAtom,
  TRACKS,
  type PlayerScreen,
} from '@entities/track';
import { useAtom, useAtomValue } from 'jotai';
import Link from 'next/link';
import type { JSX, MouseEvent } from 'react';
import { QueueToggle } from './playlist/QueueToggle';
import { ShareButton } from './transport/ShareButton';

export function PlayerHeader(): JSX.Element {
  const [screen, setScreen] = useAtom(playerScreenAtom);
  const index = useAtomValue(currentIndexAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const track = TRACKS[index];
  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, next: PlayerScreen) => {
    if (!track || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    window.history.pushState(window.history.state, '', playerPath(track, next));
    setScreen(next);
  };
  return (
    <header className="player-header flex items-center justify-between gap-sm border-b border-hairline px-md py-sm player:px-xl">
      <Link
        href="/"
        onClick={(event) => handleNavigate(event, PLAYER_SCREEN.archive)}
        className="font-label text-xs tracking-label text-paper"
      >
        SOUNDLAB
      </Link>
      <nav aria-label="주 메뉴" className="flex items-center gap-md text-xs">
        <Link
          href="/"
          aria-current={screen === PLAYER_SCREEN.archive ? 'page' : undefined}
          onClick={(event) => handleNavigate(event, PLAYER_SCREEN.archive)}
          className="text-mute transition-colors hover:text-paper aria-[current=page]:text-paper"
        >
          아카이브
        </Link>
        <Link
          href={track ? playerPath(track, PLAYER_SCREEN.nowPlaying) : '/'}
          aria-current={screen === PLAYER_SCREEN.nowPlaying ? 'page' : undefined}
          onClick={(event) => handleNavigate(event, PLAYER_SCREEN.nowPlaying)}
          className="flex items-center gap-xs text-mute transition-colors hover:text-paper aria-[current=page]:text-paper"
        >
          <span className={isPlaying ? 'text-brass' : 'text-mute'}>●</span> 감상
        </Link>
      </nav>
      <div className="flex items-center gap-xs">
        <ShareButton />
        <QueueToggle />
      </div>
    </header>
  );
}
