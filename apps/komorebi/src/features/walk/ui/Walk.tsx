'use client';

import { gameKey } from '../lib/input';
import { useEffect, useRef, useState } from 'react';
import { LANDMARKS, SPAWN, WORLDS, type Landmark } from '@shared/world/world';
import { createScene, type SceneStatus, type WalkEngine } from '../lib/scene';
import { createAmbience } from '../lib/audio';

type IconName = 'sun' | 'moon' | 'sound' | 'mute' | 'camera' | 'map' | 'close' | 'arrow' | 'home';
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />,
    sound: (
      <>
        <path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 5 6m0-6-5 6" />
      </>
    ),
    camera: (
      <>
        <path d="M3 7h4l2-3h6l2 3h4v13H3Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    map: (
      <>
        <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    home: (
      <>
        <path d="m3 10 9-7 9 7v11H3V10Z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const STORAGE_KEY = 'komorebi-discoveries-v1';
function readDiscoveries(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter(
          (id): id is string => typeof id === 'string' && LANDMARKS.some((p) => p.id === id),
        )
      : [];
  } catch {
    return [];
  }
}

export function Walk() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const engine = useRef<WalkEngine | null>(null);
  const audio = useRef<ReturnType<typeof createAmbience> | null>(null);
  const mapRef = useRef<HTMLDialogElement>(null);
  const memoryRef = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<SceneStatus>({
    ...SPAWN,
    region: 'village',
    walking: false,
    nearby: null,
    steps: 0,
  });
  const [evening, setEvening] = useState(false);
  const [sound, setSound] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [memory, setMemory] = useState<Landmark | null>(null);
  const [toast, setToast] = useState('');
  const [sprint, setSprint] = useState(false);
  const [started, setStarted] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisited(readDiscoveries());
    let cancelled = false;
    void createScene(canvasRef.current!, setStatus)
      .then((instance) => {
        if (cancelled) {
          instance.dispose();
          return;
        }
        engine.current = instance;
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error(e);
          setError(
            '풍경을 불러오지 못했어요. 페이지를 새로고침하거나 브라우저의 하드웨어 가속 설정을 확인해 주세요.',
          );
        }
      });
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
      audio.current?.dispose();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    engine.current?.setEvening(evening);
  }, [evening]);
  useEffect(() => {
    engine.current?.setInput('shift', sprint);
  }, [sprint]);
  useEffect(() => {
    if (status.walking) setStarted(true);
  }, [status.walking]);
  useEffect(() => {
    const pauseSound = () => {
      if (document.hidden) {
        audio.current?.dispose();
        audio.current = null;
        setSound(false);
      }
    };
    document.addEventListener('visibilitychange', pauseSound);
    return () => document.removeEventListener('visibilitychange', pauseSound);
  }, []);
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }
  function discover() {
    if (!status.nearby) return;
    const point = status.nearby;
    setMemory(point);
    if (!visited.includes(point.id)) {
      const next = [...visited, point.id];
      setVisited(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* The walk remains playable when storage is unavailable. */
      }
    }
    memoryRef.current?.showModal();
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        mapRef.current?.open ||
        memoryRef.current?.open ||
        (event.target instanceof HTMLElement && /BUTTON|INPUT|TEXTAREA/.test(event.target.tagName))
      )
        return;
      if (gameKey(event) === 'e') discover();
      if (gameKey(event) === 'm') mapRef.current?.showModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  function toggleSound() {
    if (audio.current) {
      audio.current.dispose();
      audio.current = null;
      setSound(false);
    } else {
      try {
        audio.current = createAmbience();
        setSound(true);
      } catch {
        notify('이 브라우저에서는 소리를 재생할 수 없어요.');
      }
    }
  }
  function closeDialog(dialog: HTMLDialogElement | null) {
    dialog?.close();
    canvasRef.current?.querySelector('canvas')?.focus({ preventScroll: true });
  }
  const mapX = (x: number) => x * 4;
  const mapY = (z: number) => z * 3;
  const mapPosition = status;
  function guideTo(id: string) {
    engine.current?.travelTo(id);
    setStarted(true);
    closeDialog(mapRef.current);
    notify('길을 따라 걸어갈게요. 방향키를 누르면 직접 움직일 수 있어요.');
  }

  return (
    <main className={`walk ${evening ? 'is-evening' : ''} ${started ? 'has-started' : ''}`}>
      <div className="landscape" ref={canvasRef} />
      <div className="paper-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <header className="game-header">
        <div className="day-card">
          <span className="day-sun">
            <Icon name={evening ? 'moon' : 'sun'} />
          </span>
          <div>
            <span className="day-label">여름방학</span>
            <strong>첫째 날</strong>
            <small>{evening ? '해 질 녘' : '오후 2시 30분'}</small>
          </div>
        </div>
        <h1 className="game-name">
          여름빛 산책 <span>木漏れ日</span>
        </h1>
      </header>
      <div className="scene-caption" key={status.region}>
        <span>—</span> {WORLDS[status.region].name} <span>—</span>
      </div>

      <nav className="tools" aria-label="산책 설정">
        <button
          className="tool"
          title={evening ? '한낮으로 바꾸기' : '노을로 바꾸기'}
          aria-label={evening ? '한낮으로 바꾸기' : '노을로 바꾸기'}
          aria-pressed={evening}
          onClick={() => setEvening((v) => !v)}
        >
          <Icon name={evening ? 'moon' : 'sun'} />
        </button>
        <button
          className="tool"
          title={sound ? '자연 소리 끄기' : '자연 소리 켜기'}
          aria-label={sound ? '자연 소리 끄기' : '자연 소리 켜기'}
          aria-pressed={sound}
          onClick={toggleSound}
        >
          <Icon name={sound ? 'sound' : 'mute'} />
        </button>
        <span className="tool-divider" />
        <button
          className="tool"
          title="풍경 사진 저장"
          aria-label="풍경 사진 저장"
          disabled={!ready}
          onClick={() => {
            engine.current?.photo();
            notify('오늘의 여름을 사진으로 간직했어요.');
          }}
        >
          <Icon name="camera" />
        </button>
        <button
          className="tool"
          title="산책 지도 (M)"
          aria-label="산책 지도 열기"
          onClick={() => mapRef.current?.showModal()}
        >
          <Icon name="map" />
        </button>
      </nav>

      {!started && ready && (
        <div className="start-hint">
          <span className="hint-spark">✧</span> 어디로 가 볼까? 방향키 또는 길을 클릭해 봐!{' '}
          <span className="hint-spark">✧</span>
        </div>
      )}
      {status.nearby && !memoryRef.current?.open && (
        <button className="interact" onClick={discover}>
          <kbd>E</kbd>
          <span>
            {status.nearby.name}
            <small>
              {visited.includes(status.nearby.id) ? '추억 다시 읽기' : '잠깐 머물러 보기'}
            </small>
          </span>
          <Icon name="arrow" />
        </button>
      )}

      <footer className="bottom-bar">
        <div className="location">
          <span className="location-marker">⌖</span>
          <div>
            <span className="small-label">지금, 여기</span>
            <strong>{status.nearby?.short ?? WORLDS[status.region].name}</strong>
          </div>
        </div>
        <div className="keyboard-help">
          <span>
            <kbd>W</kbd>
            <span className="key-row">
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </span>
          </span>
          <span className="control-copy">방향키 / 길 클릭</span>
          <i />
          <kbd className="wide-key">Shift</kbd>
          <span className="control-copy">달리기</span>
          <kbd className="wide-key">Space</kbd>
          <span className="control-copy">점프</span>
        </div>
        <button className="journal-button" onClick={() => mapRef.current?.showModal()}>
          <span className="journal-dots">
            {LANDMARKS.map((p) => (
              <span key={p.id} className={visited.includes(p.id) ? 'filled' : ''} />
            ))}
          </span>
          <span>
            그림일기{' '}
            <b>
              {visited.length} / {LANDMARKS.length}
            </b>
          </span>
          <Icon name="arrow" />
        </button>
      </footer>

      <div className="mobile-controls" aria-label="터치 이동">
        <div className="dpad">
          {[
            { key: 'w', label: '앞으로', symbol: '↑' },
            { key: 'a', label: '왼쪽으로', symbol: '←' },
            { key: 's', label: '뒤로', symbol: '↓' },
            { key: 'd', label: '오른쪽으로', symbol: '→' },
          ].map(({ key, label, symbol }) => (
            <button
              key={key}
              className={`direction direction-${key}`}
              aria-label={label}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                engine.current?.setInput(key, true);
              }}
              onPointerUp={() => engine.current?.setInput(key, false)}
              onPointerCancel={() => engine.current?.setInput(key, false)}
              onLostPointerCapture={() => engine.current?.setInput(key, false)}
            >
              {symbol}
            </button>
          ))}
        </div>
        <div className="action-buttons">
          <button
            className="jump-button"
            aria-label="점프"
            disabled={!ready}
            onClick={() => engine.current?.setInput(' ', true)}
          >
            점프 ↑
          </button>
          <button className="run-button" aria-pressed={sprint} onClick={() => setSprint((v) => !v)}>
            {sprint ? '걷기' : '달리기'}
          </button>
        </div>
      </div>

      <div className={`toast ${toast ? 'visible' : ''}`} role="status">
        {toast}
      </div>
      {!ready && (
        <div className="loading">
          <span className="loading-mark">木</span>
          <p>{error || '여름을 한 장씩 펼치고 있어요…'}</p>
          {error && <button onClick={() => window.location.reload()}>다시 시도</button>}
        </div>
      )}

      <dialog
        className="map-dialog"
        ref={mapRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDialog(mapRef.current);
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">YOUR LITTLE ADVENTURE</span>
            <h2>여름을 걷는 지도</h2>
          </div>
          <button
            className="tool"
            aria-label="지도 닫기"
            onClick={() => closeDialog(mapRef.current)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-intro">
          목적지를 누르면 길을 따라 걸어가요. 도착하면 <kbd>E</kbd>로 추억을 간직하세요.
        </p>
        <svg
          className="village-map"
          viewBox="0 0 400 300"
          role="img"
          aria-label={`산책 지도. 현재 좌표 ${Math.round(status.x)}, ${Math.round(status.z)}`}
        >
          <image
            href={WORLDS[status.region].image}
            width="400"
            height="300"
            preserveAspectRatio="none"
            opacity=".75"
          />
          {WORLDS[status.region].routes.map((edge) => {
            const a = WORLDS[status.region].nodes.find((n) => n.id === edge.a)!;
            const b = WORLDS[status.region].nodes.find((n) => n.id === edge.b)!;
            return (
              <line
                key={edge.a + edge.b}
                x1={mapX(a.x)}
                y1={mapY(a.z)}
                x2={mapX(b.x)}
                y2={mapY(b.z)}
                stroke="#fff4c6"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            );
          })}
          {LANDMARKS.filter((p) => p.region === status.region).map((p) => {
            const point = p;
            return (
              <g key={p.id} transform={`translate(${mapX(point.x)}, ${mapY(point.z)})`}>
                <circle
                  r="12"
                  fill={visited.includes(p.id) ? '#526b49' : '#faf4de'}
                  stroke="#8a9a71"
                />
                <text
                  textAnchor="middle"
                  dy="5"
                  fontSize="13"
                  fill={visited.includes(p.id) ? '#fff8df' : '#526b49'}
                >
                  {visited.includes(p.id) ? '✓' : p.icon}
                </text>
                <text
                  textAnchor="middle"
                  y="27"
                  fontSize="10"
                  fill="#fffbe7"
                  stroke="#304431"
                  strokeWidth="2"
                  paintOrder="stroke"
                >
                  {p.short}
                </text>
              </g>
            );
          })}
          <circle
            cx={mapX(mapPosition.x)}
            cy={mapY(mapPosition.z)}
            r="10"
            fill="#e99b4e"
            opacity="0.4"
          />
          <circle
            cx={mapX(mapPosition.x)}
            cy={mapY(mapPosition.z)}
            r="5"
            fill="#e99b4e"
            stroke="#fff7e8"
            strokeWidth="2"
          />
        </svg>
        <div className="discovery-list">
          {LANDMARKS.map((p) => (
            <button key={p.id} onClick={() => guideTo(p.id)} disabled={!ready}>
              <span className={`stamp ${visited.includes(p.id) ? 'collected' : ''}`}>{p.icon}</span>
              <div>
                <strong>{p.name}</strong>
                <small>
                  {visited.includes(p.id) ? '추억을 간직했어요' : '아직 만나지 않은 풍경'}
                </small>
              </div>
              <span className="discovery-check">{visited.includes(p.id) ? '✓' : '→'}</span>
            </button>
          ))}
        </div>
        <div className="map-footer">
          <span>
            {visited.length === LANDMARKS.length
              ? '여섯 조각의 여름, 모두 모았어요. 계속 걸어 볼까요?'
              : `${status.steps.toLocaleString()} 걸음만큼 쌓인 여름`}
          </span>
          <button
            onClick={() => {
              engine.current?.reset();
              closeDialog(mapRef.current);
              notify('처음 출발했던 마을 입구로 돌아왔어요.');
            }}
          >
            <Icon name="home" /> 마을 입구로
          </button>
        </div>
      </dialog>

      <dialog
        className="memory-dialog"
        ref={memoryRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDialog(memoryRef.current);
        }}
      >
        <button
          className="tool memory-close"
          aria-label="추억 닫기"
          onClick={() => closeDialog(memoryRef.current)}
        >
          <Icon name="close" />
        </button>
        <span className="memory-symbol">{memory?.icon}</span>
        <span className="eyebrow">A PIECE OF SUMMER</span>
        <h2>{memory?.name}</h2>
        <p>{memory?.text}</p>
        <span className="memory-line" />
        <span className="memory-count">
          여름의 조각 {visited.length} / {LANDMARKS.length}
        </span>
        <button className="continue-button" onClick={() => closeDialog(memoryRef.current)}>
          조금 더 걸어 볼까 <Icon name="arrow" />
        </button>
      </dialog>
    </main>
  );
}
