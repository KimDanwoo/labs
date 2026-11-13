import { useRef, useState, type JSX } from 'react';
import { MUSIC_STATUS, musicTime, musicWidgetSrc } from '../../lib/music/soundcloud';
import { useMusicPlayer } from '../../model/hooks/music/useMusicPlayer';

type Props = { source: string; initialVolume: number; profile: string };

export function MusicPlayer({ source, initialVolume, profile }: Props): JSX.Element {
  const { iframe: iframeRef, ...player } = useMusicPlayer(source, initialVolume);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleButton = useRef<HTMLButtonElement>(null);
  const isReady = player.status === MUSIC_STATUS.ready;
  const duration = player.track?.duration ?? 0;
  const currentPosition = Math.min(player.position, duration);
  const ordinal = player.tracks.findIndex((track) => track.id === player.track?.id);
  const isLast = ordinal >= player.tracks.length - 1;
  const openLabel = player.isPlaying ? 'MP3 열기 · 재생 중' : 'MP3 열기';
  const toggleLabel = isExpanded ? 'MP3 닫기' : openLabel;

  function collapse() {
    setIsExpanded(false);
    toggleButton.current?.focus();
  }

  return (
    <section
      className={`music-player ${isExpanded ? 'is-expanded' : ''}`}
      aria-label="주머니 속 MP3"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape' && isExpanded) {
          event.preventDefault();
          collapse();
        }
      }}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <button
        ref={toggleButton}
        className={`music-toggle ${player.isPlaying ? 'is-playing' : ''}`}
        aria-label={toggleLabel}
        aria-expanded={isExpanded}
        aria-controls="music-panel"
        onClick={() => (isExpanded ? collapse() : setIsExpanded(true))}
      >
        <span aria-hidden="true">♫</span>
      </button>
      <div id="music-panel" className="music-panel" hidden={!isExpanded}>
        <div className="music-now">
          <strong>{player.track?.title ?? '노래를 읽는 중…'}</strong>
          <button disabled={!isReady} onClick={player.toggle} aria-label={player.isPlaying ? '일시정지' : '재생'}>
            {player.isPlaying ? 'Ⅱ' : '▶'}
          </button>
          <button disabled={!isReady || isLast} onClick={player.next} aria-label="다음 곡">
            ▶▶
          </button>
        </div>
        <input
          className="music-seek"
          type="range"
          aria-label="재생 위치"
          min={0}
          max={Math.max(1, duration)}
          step={1000}
          value={currentPosition}
          disabled={!isReady || !duration}
          onChange={(event) => player.seek(Number(event.target.value))}
          aria-valuetext={`${musicTime(currentPosition)} / ${musicTime(duration)}`}
        />
        {player.status === MUSIC_STATUS.error && (
          <p className="music-error" role="status">
            노래를 불러오지 못했어요. <button onClick={player.retry}>다시 불러오기</button>
          </p>
        )}
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
        <a className="music-credit" href={player.track?.url ?? profile} target="_blank" rel="noopener noreferrer">
          SoundCloud ↗
        </a>
      </div>
      <iframe
        key={player.attempt}
        ref={iframeRef}
        className="music-engine"
        title="DANWOO SoundCloud 플레이어"
        src={musicWidgetSrc(source)}
        allow="autoplay"
        tabIndex={-1}
        aria-hidden="true"
      />
    </section>
  );
}
