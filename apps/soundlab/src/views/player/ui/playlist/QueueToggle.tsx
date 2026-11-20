'use client';

import { useAtom, useAtomValue } from 'jotai';

import { PLAYER_SCREEN, TRACKS } from '@entities/track';
import { FloatingButton } from '@shared/ui/FloatingButton';
import { playerPath } from '@views/player/lib/playerUrl';
import { currentIndexAtom, playerScreenAtom } from '@views/player/model/store/playback';

import { PLAYLIST_ID } from '@views/player/config/layout';
import { QueueIcon } from '@views/player/ui/playlist/QueueIcon';

export function QueueToggle() {
  const [screen, setScreen] = useAtom(playerScreenAtom);
  const track = TRACKS[useAtomValue(currentIndexAtom)];
  const isQueue = screen === PLAYER_SCREEN.queue;
  const label = isQueue ? '현재 재생으로' : '재생목록';

  const handleClick = () => {
    const next = isQueue ? PLAYER_SCREEN.nowPlaying : PLAYER_SCREEN.queue;
    if (track) window.history.pushState(window.history.state, '', playerPath(track, next));
    setScreen(next);
  };

  return (
    <FloatingButton
      aria-pressed={isQueue}
      aria-controls={PLAYLIST_ID}
      aria-label={label}
      title={label}
      className="ring-hairline bg-void/80 text-paper ring-1 hover:bg-void hover:text-white focus-visible:bg-void aria-[pressed=true]:ring-brass/40 aria-[pressed=true]:bg-brass/20 aria-[pressed=true]:text-brass"
      onClick={handleClick}
    >
      <QueueIcon />
    </FloatingButton>
  );
}
