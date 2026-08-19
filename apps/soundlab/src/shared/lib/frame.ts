import { useEffect, useRef } from 'react';

type FrameCallback = (deltaMs: number) => void;

const callbacks = new Set<FrameCallback>();
let handle = 0;
let last = 0;

function tick(now: number) {
  // 탭이 백그라운드에 있었다면 delta가 수 초로 튄다. 보간이 폭주하지 않게 상한을 둔다.
  const delta = last === 0 ? 16.7 : Math.min(64, now - last);
  last = now;
  for (const callback of callbacks) callback(delta);
  handle = requestAnimationFrame(tick);
}

/** 위젯마다 rAF 루프를 만들지 않는다. 앱 전체가 한 루프를 공유한다. */
export function subscribeFrame(callback: FrameCallback) {
  callbacks.add(callback);
  if (!handle) {
    last = 0;
    handle = requestAnimationFrame(tick);
  }
  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      cancelAnimationFrame(handle);
      handle = 0;
    }
  };
}

export function useFrame(callback: FrameCallback) {
  const latest = useRef(callback);
  // 렌더 중에 ref를 쓰면 버려질 렌더의 값이 남을 수 있다. 커밋 후에 갱신한다.
  useEffect(() => {
    latest.current = callback;
  }, [callback]);
  useEffect(() => subscribeFrame((delta) => latest.current(delta)), []);
}
