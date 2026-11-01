import { DANWOO_PROFILE, MUSIC_STATUS, musicSource, musicTime, musicWidgetSrc } from '@features/music/lib/soundcloud';
import { useMusicPlayer } from '@features/music/model/hooks';
import { useRef, useState } from 'react';

export function MusicPlayer({
  source,
  initialVolume,
  onRetry,
  onSource,
  onPowerOff,
  profile,
}: {
  source: string;
  initialVolume: number;
  onRetry: () => void;
  onSource: (source: string) => void;
  onPowerOff: () => void;
  profile: string;
}) {
  const { iframe: iframeRef, ...player } = useMusicPlayer(source, initialVolume);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sourceInput, setSourceInput] = useState(source === DANWOO_PROFILE ? '' : source);
  const [sourceError, setSourceError] = useState('');
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
      aria-label="DANWOO MP3 플레이어"
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
            <small>DANWOO · 산책의 배경음악</small>
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
          {player.status === MUSIC_STATUS.loading ? '사운드클라우드에서 노래를 불러오는 중…' : ''}
          {player.status === MUSIC_STATUS.error
            ? '음악을 연결하지 못했어요. 다시 연결하거나 아래 사클 플레이어를 열어 주세요.'
            : ''}
          {isReady
            ? `${player.tracks.length}곡 · ${player.isPlaying ? '음악과 함께 걷는 중' : '재생을 눌러 산책을 시작해요'}`
            : ''}
        </p>
        {player.status === MUSIC_STATUS.error && (
          <button className="music-text-button" onClick={onRetry}>
            다시 연결
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
            onChange={(event) => player.changeVolume(Number(event.target.value))}
          />
          <span>{player.volume}%</span>
        </label>
        <p className="music-hint">접어도 음악은 계속돼요. 자연 소리는 위의 스피커 버튼으로 따로 조절해요.</p>
        <details className="music-track-list">
          <summary>플레이리스트 · {player.tracks.length}곡</summary>
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
        <details className="music-source">
          <summary>내 사클 플레이리스트 연결</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const next = musicSource(sourceInput);
              if (!next) {
                setSourceError('danwooking 계정의 공개 플레이리스트 주소를 넣어 주세요.');
                return;
              }
              setSourceError('');
              onSource(next);
            }}
          >
            <label>
              플레이리스트 주소
              <input
                type="url"
                value={sourceInput}
                onChange={(event) => setSourceInput(event.target.value)}
                placeholder="https://soundcloud.com/danwooking/sets/…"
                required
              />
            </label>
            <button type="submit" className="music-text-button">
              이 플레이리스트 듣기
            </button>
            <button type="button" className="music-text-button" onClick={() => onSource(DANWOO_PROFILE)}>
              DANWOO 공개 곡으로 돌아가기
            </button>
            {sourceError && <p role="alert">{sourceError}</p>}
          </form>
        </details>
        <details className="music-native" open={player.status === MUSIC_STATUS.error}>
          <summary>SoundCloud 플레이어 직접 열기</summary>
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
            DANWOO on SoundCloud ↗
          </a>
          <button onClick={onPowerOff}>MP3 끄기</button>
        </div>
      </div>
    </section>
  );
}
