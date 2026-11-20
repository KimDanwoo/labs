import { useMusicPanelContext } from '@views/walk/model/hooks/music/useMusicPanelContext';

export function MusicToggle() {
  const { player, isExpanded, toggleButton, toggle } = useMusicPanelContext();
  const openLabel = player.isPlaying ? 'MP3 열기 · 재생 중' : 'MP3 열기';
  return (
    <button
      ref={toggleButton}
      className={`music-toggle ${player.isPlaying ? 'is-playing' : ''}`}
      aria-label={isExpanded ? 'MP3 닫기' : openLabel}
      aria-expanded={isExpanded}
      aria-controls="music-panel"
      onClick={toggle}
    >
      <span aria-hidden="true">♫</span>
    </button>
  );
}
