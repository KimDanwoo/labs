import { musicWidgetSrc } from '../../lib/music/musicSettings';
import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

export function MusicEngine() {
  const { player, iframe, source } = useMusicPanelContext();
  return (
    <iframe
      key={player.attempt}
      ref={iframe}
      className="music-engine"
      title="DANWOO SoundCloud 플레이어"
      src={musicWidgetSrc(source)}
      allow="autoplay"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
