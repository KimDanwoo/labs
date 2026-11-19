import { musicTime } from '../../lib/music/musicSettings';
import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

export function MusicTrackList() {
  const { player } = useMusicPanelContext();
  return (
    <ol className="music-list">
      {player.tracks.map((track) => (
        <li key={track.id}>
          <button
            aria-current={track.id === player.track?.id ? 'true' : undefined}
            onClick={() => player.choose(track.index)}
          >
            <span>{track.title}</span>
            <small>{musicTime(track.duration)}</small>
          </button>
        </li>
      ))}
    </ol>
  );
}
