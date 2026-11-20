import { musicWidgetSrc } from '@views/walk/lib/music/musicSettings';
import { useMusicPanelContext } from '@views/walk/model/hooks/music/useMusicPanelContext';

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
