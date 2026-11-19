import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

export function MusicCredit() {
  const { player, profile } = useMusicPanelContext();
  return (
    <a className="music-credit" href={player.track?.url ?? profile} target="_blank" rel="noopener noreferrer">
      SoundCloud ↗
    </a>
  );
}
