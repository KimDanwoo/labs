import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

export function MusicNow() {
  const { player, isReady, isLast } = useMusicPanelContext();
  return (
    <div className="music-now">
      <strong>{player.track?.title ?? '노래를 읽는 중…'}</strong>
      <button disabled={!isReady} onClick={player.toggle} aria-label={player.isPlaying ? '일시정지' : '재생'}>
        {player.isPlaying ? 'Ⅱ' : '▶'}
      </button>
      <button disabled={!isReady || isLast} onClick={player.next} aria-label="다음 곡">
        ▶▶
      </button>
    </div>
  );
}
