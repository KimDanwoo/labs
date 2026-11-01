import { MUSIC_STATUS, musicTime, musicWidgetSrc } from '@features/music/lib/soundcloud';
import { useMusicPlayer } from '@features/music/model/hooks';
import { useRef, useState } from 'react';

export function MusicPlayer({
  source,
  initialVolume,
  onRetry,
  onPowerOff,
  profile,
}: {
  source: string;
  initialVolume: number;
  onRetry: () => void;
  onPowerOff: () => void;
  profile: string;
}) {
  const { iframe: iframeRef, ...player } = useMusicPlayer(source, initialVolume);
  const [isExpanded, setIsExpanded] = useState(true);
  const expandButton = useRef<HTMLButtonElement>(null);
  const isReady = player.status === MUSIC_STATUS.ready;
  const currentPosition = Math.min(player.position, player.track?.duration ?? 0);
  const ordinal = player.tracks.findIndex((track) => track.id === player.track?.id);
  function collapse() {
    setIsExpanded(false);
    expandButton.current?.focus();
  }
  return (
    <section
      className={`music-player ${isExpanded ? 'is-expanded' : ''}`}
      aria-label="주머니 속 MP3"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          collapse();
        }
      }}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <div className="music-mini">
        <button
          ref={expandButton}
          className="music-screen"
          aria-label={isExpanded ? 'MP3 접기 · 음악은 계속 재생' : 'MP3 펼치기'}
          aria-expanded={isExpanded}
          aria-controls="music-controls"
          onClick={() => setIsExpanded((value) => !value)}
        >
          <span className={`music-note ${player.isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
            ♫
          </span>
          <span>
            <small>MY MP3 · 산책할 때 듣는 노래</small>
            <strong>{player.track?.title ?? '주머니 속 작은 MP3'}</strong>
          </span>
        </button>
        <button
          className="music-play"
          disabled={!isReady}
          onClick={player.toggle}
          aria-label={player.isPlaying ? '음악 일시정지' : '음악 재생'}
        >
          {player.isPlaying ? 'Ⅱ' : '▶'}
        </button>
      </div>
      <div id="music-controls" hidden={!isExpanded} className="music-controls">
        <p className="music-status" role="status">
          {player.status === MUSIC_STATUS.loading ? 'MP3에 담아 둔 노래를 읽는 중…' : ''}
          {player.status === MUSIC_STATUS.error
            ? '노래를 불러오지 못했어요. 다시 불러오거나 아래 원본 플레이어를 열어 주세요.'
            : ''}
          {isReady
            ? `담아 둔 ${player.tracks.length}곡 · ${player.isPlaying ? '음악과 함께 걷는 중' : '재생을 눌러 산책을 시작해요'}`
            : ''}
        </p>
        {player.status === MUSIC_STATUS.error && (
          <button className="music-text-button" onClick={onRetry}>
            다시 불러오기
          </button>
        )}
        <div className="music-transport">
          <button disabled={!isReady || ordinal <= 0} onClick={player.prev} aria-label="이전 곡">
            ◀◀
          </button>
          <span>
            {ordinal >= 0 ? ordinal + 1 : 0} / {player.tracks.length}
          </span>
          <button disabled={!isReady || ordinal >= player.tracks.length - 1} onClick={player.next} aria-label="다음 곡">
            ▶▶
          </button>
        </div>
        <label className="music-range">
          재생 위치
          <input
            type="range"
            min={0}
            max={Math.max(1, player.track?.duration ?? 0)}
            step={1000}
            value={currentPosition}
            disabled={!isReady || !player.track?.duration}
            onChange={(event) => player.seek(Number(event.target.value))}
            aria-valuetext={`${musicTime(currentPosition)} / ${musicTime(player.track?.duration ?? 0)}`}
          />
          <span>
            {musicTime(currentPosition)} / {musicTime(player.track?.duration ?? 0)}
          </span>
        </label>
        <label className="music-range">
          음악 볼륨
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={player.volume}
            disabled={!isReady}
            onChange={(event) => player.changeVolume(Number(event.target.value))}
          />
          <span>{player.volume}%</span>
        </label>
        <p className="music-hint">접어도 음악은 계속돼요. 자연 소리는 위의 스피커 버튼으로 따로 조절해요.</p>
        <details className="music-track-list" open>
          <summary>담아 둔 노래 · {player.tracks.length}곡</summary>
          <ol>
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
        </details>
        <details className="music-native" open={player.status === MUSIC_STATUS.error}>
          <summary>원본 플레이어 열기</summary>
          <iframe
            ref={iframeRef}
            title="DANWOO SoundCloud 플레이어"
            src={musicWidgetSrc(source)}
            width="100%"
            height="166"
            allow="autoplay"
          />
        </details>
        <div className="music-footer">
          <a href={player.track?.url ?? profile} target="_blank" rel="noreferrer">
            음악 출처 · SoundCloud ↗
          </a>
          <button onClick={onPowerOff}>MP3 끄기</button>
        </div>
      </div>
    </section>
  );
}
