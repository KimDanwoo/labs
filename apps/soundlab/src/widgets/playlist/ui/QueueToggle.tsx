'use client';

import { PLAYER_SCREEN } from '@entities/track/model/constants/playerScreen';
import { TRACKS } from '@entities/track/model/constants/tracks';
import { playerPath } from '@entities/track/model/services';
import { currentIndexAtom, playerScreenAtom } from '@entities/track/model/store';
import { FLOATING_BUTTON } from '@shared/lib/floatingButton';
import { useAtom, useAtomValue } from 'jotai';
import { QueueIcon } from './icons';

/**
 * 재생목록 화면과 현재 재생 화면을 오간다.
 *
 * Link/router가 아니라 pushState다 — 라우터로 이동하면 트리가 리마운트되고 재생 엔진 iframe이 사라진다.
 * 주소는 진짜 라우트(/t/<id>/queue)라서 새로고침·공유·뒤로가기가 그대로 동작한다.
 */
// 주 내비게이션이라 공유 버튼보다 밝게, 링을 둘러 배경에서 떼어낸다(아트워크 위에서도 눈에 걸리게).
const QUEUE_BUTTON = [
  FLOATING_BUTTON,
  'ring-hairline bg-void/80 text-paper ring-1 hover:bg-void hover:text-white focus-visible:bg-void',
  'aria-[pressed=true]:ring-brass/40 aria-[pressed=true]:bg-brass/20 aria-[pressed=true]:text-brass',
].join(' ');

export function QueueToggle() {
  const [screen, setScreen] = useAtom(playerScreenAtom);
  const index = useAtomValue(currentIndexAtom);
  const track = TRACKS[index];
  const isQueue = screen === PLAYER_SCREEN.queue;
  const label = isQueue ? '현재 재생으로' : '재생목록';

  const handleClick = () => {
    const next = isQueue ? PLAYER_SCREEN.nowPlaying : PLAYER_SCREEN.queue;
    if (track) window.history.pushState(window.history.state, '', playerPath(track, next));
    setScreen(next);
  };

  return (
    <button
      type="button"
      aria-pressed={isQueue}
      aria-controls="playlist"
      aria-label={label}
      title={label}
      className={QUEUE_BUTTON}
      onClick={handleClick}
    >
      <QueueIcon />
    </button>
  );
}
