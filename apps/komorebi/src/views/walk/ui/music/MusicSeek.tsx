import { MS_PER_SECOND } from '../../config/time';
import { musicTime } from '../../lib/music/musicSettings';
import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

export function MusicSeek() {
  const { player, isReady, duration, position } = useMusicPanelContext();
  return (
    <input
      className="music-seek"
      type="range"
      aria-label="재생 위치"
      min={0}
      max={Math.max(1, duration)}
      step={MS_PER_SECOND}
      value={position}
      disabled={!isReady || !duration}
      onChange={(event) => player.seek(Number(event.target.value))}
      aria-valuetext={`${musicTime(position)} / ${musicTime(duration)}`}
    />
  );
}
