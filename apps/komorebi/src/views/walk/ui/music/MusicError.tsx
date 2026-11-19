import { MUSIC_STATUS } from '../../lib/music/musicSettings';
import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

export function MusicError() {
  const { player } = useMusicPanelContext();
  if (player.status !== MUSIC_STATUS.error) return null;
  return (
    <p className="music-error" role="status">
      노래를 불러오지 못했어요. <button onClick={player.retry}>다시 불러오기</button>
    </p>
  );
}
