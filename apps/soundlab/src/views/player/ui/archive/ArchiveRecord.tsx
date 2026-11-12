import {
  artworkUrl,
  currentIndexAtom,
  isPlayingAtom,
  PLAYER_SCREEN,
  playerPath,
  playerScreenAtom,
  TRACKS,
  usePlaybackControls,
  type Track,
} from '@entities/track';
import { useAtomValue, useSetAtom } from 'jotai';
import type { JSX, MouseEvent } from 'react';

type Props = { track: Track; position: number };

export function ArchiveRecord({ track, position }: Props): JSX.Element {
  const current = useAtomValue(currentIndexAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const setScreen = useSetAtom(playerScreenAtom);
  const { select } = usePlaybackControls();
  const index = TRACKS.findIndex((item) => item.id === track.id);
  const isCurrent = current === index && isPlaying;
  const href = playerPath(track, PLAYER_SCREEN.nowPlaying);
  const handleOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    window.history.pushState(window.history.state, '', href);
    setScreen(PLAYER_SCREEN.nowPlaying);
    select(index);
  };
  const seconds = Math.floor(track.durationMs / 1000);
  return (
    <article className={`record ${position === 0 ? 'record-featured' : ''}`}>
      <a
        href={href}
        onClick={handleOpen}
        className="record-link group block outline-none"
        aria-label={`${track.title} 감상`}
      >
        <div className="record-art relative aspect-square overflow-hidden bg-hairline-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkUrl(track, 't500x500')}
            alt=""
            loading={position < 3 ? 'eager' : 'lazy'}
            decoding="async"
            className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          <span
            className="record-play absolute right-md bottom-md grid size-12 place-items-center rounded-full bg-paper text-lg text-void transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="absolute top-sm left-sm bg-void/80 px-sm py-xs font-label text-xs text-paper">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-start justify-between gap-sm pt-sm">
          <div className="min-w-0">
            <h3 className="record-title text-base leading-snug font-normal text-paper">{track.title}</h3>
            <p className="mt-xs font-label text-xs text-mute">{isCurrent ? '재생 중' : track.genre}</p>
          </div>
          <span className="shrink-0 pt-xs font-label text-xs text-mute">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </span>
        </div>
      </a>
    </article>
  );
}
