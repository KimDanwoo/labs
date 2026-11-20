import type { Track } from '@entities/track';
import { REQUEST_TIMEOUT_MS } from '@views/player/config/network';

const WIDGET_API_SRC = 'https://w.soundcloud.com/player/api.js';

/** loadedProgress는 loadProgress와 playProgress 양쪽에 실려 온다. 한쪽이 안 와도 버퍼 표시가 살아남는다. */
type WidgetPayload = { currentPosition?: number; relativePosition?: number; loadedProgress?: number };

export type ScWidget = {
  bind(event: string, callback: (payload: WidgetPayload) => void): void;
  unbind(event: string): void;
  load(url: string, options?: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
  /** 0–100. 페이드에 쓴다 — 위젯 오디오는 cross-origin이라 이게 유일한 음량 손잡이다. */
  setVolume(volume: number): void;
  getDuration(callback: (milliseconds: number) => void): void;
  skip(soundIndex: number): void;
  getSounds(callback: (sounds: unknown[]) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
};

type ScGlobal = {
  Widget: ((element: HTMLIFrameElement | string) => ScWidget) & {
    Events: Record<string, string>;
  };
};

declare global {
  var SC: ScGlobal | undefined;
}

let pending: Promise<ScGlobal> | null = null;

export function loadWidgetApi(): Promise<ScGlobal> {
  if (globalThis.SC) return Promise.resolve(globalThis.SC);
  if (!pending) {
    pending = new Promise<ScGlobal>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WIDGET_API_SRC;
      script.async = true;
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error('재생 API 연결 시간 초과'));
      }, REQUEST_TIMEOUT_MS);
      script.onload = () => {
        clearTimeout(timer);
        if (globalThis.SC) resolve(globalThis.SC);
        else reject(new Error('api.js를 불러왔지만 SC 전역이 없습니다'));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('SoundCloud Widget API 로드 실패'));
      };
      document.head.append(script);
    });
    // 실패까지 캐시하면 새로고침 전엔 재시도가 불가능하다. 다음 호출이 다시 시도하게 비운다.
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}

export function trackUrl(track: Track): string {
  return `https://api.soundcloud.com/tracks/${track.id}`;
}

/**
 * 곡 전체를 한 플레이어에 올린다. 성공하면 전환이 widget.skip()으로 끝나 새 재생 시작이 사라진다
 * — 백그라운드에서 다음 곡으로 넘어가려면 이게 필요하다.
 *
 * 콤마로 이어붙인 `tracks/id1,id2,...`는 위젯이 404로 거절한다. 프로필 URL은 받는다.
 * permalinkUrl에서 뽑아 쓰므로 계정이 바뀌어도 따라간다.
 */
export function setUrl(tracks: readonly Track[]): string | null {
  const first = tracks[0];
  if (!first) return null;
  const [scheme, , host, user] = first.permalinkUrl.split('/');
  if (!scheme || !host || !user) return null;
  return `${scheme}//${host}/${user}`;
}

function soundId(sound: unknown): number | null {
  if (typeof sound !== 'object' || sound === null || !('id' in sound)) return null;
  return typeof sound.id === 'number' && Number.isSafeInteger(sound.id) && sound.id > 0 ? sound.id : null;
}

/** 위젯이 준 사운드 목록을 위치 그대로 id 배열로 옮긴다. 자리를 지우지 않는 게 핵심이다. */
export const readSoundIds = (sounds: unknown[]) => (Array.isArray(sounds) ? sounds.map(soundId) : []);

const ENGINE_FRAME_SIZE = { width: 320, height: 166 };
const ENGINE_FRAME_STYLE = `position:fixed;left:0;top:0;width:${ENGINE_FRAME_SIZE.width}px;height:${ENGINE_FRAME_SIZE.height}px;opacity:0;pointer-events:none;border:0`;

/**
 * 소리만 내는 숨은 위젯 iframe을 문서에 붙인다. display:none은 일부 엔진에서 미디어 재생을 막아 투명으로 둔다.
 * 크기는 기본 플레이어만큼 둔다 — 너무 작으면 위젯 안의 파형 캔버스 폭이 0이 되어 createPattern 오류가 난다.
 */
export function mountEngineFrame(src: string): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.style.cssText = ENGINE_FRAME_STYLE;
  frame.allow = 'autoplay';
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'SoundCloud 재생 엔진';
  frame.src = src;
  document.body.append(frame);
  return frame;
}

export function widgetSrc(url: string): string {
  const params = new URLSearchParams({
    url,
    auto_play: 'false',
    show_artwork: 'false',
    show_comments: 'false',
    show_user: 'false',
    show_teaser: 'false',
    hide_related: 'true',
    sharing: 'false',
    download: 'false',
    buying: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params}`;
}
