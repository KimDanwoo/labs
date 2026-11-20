import { useEffect, useRef } from 'react';

type FrameCallback = (deltaMs: number) => void;

const callbacks = new Set<FrameCallback>();
let handle = 0;
let last = 0;

function tick(now: number) {
  const delta = last === 0 ? 16.7 : Math.min(64, now - last);
  last = now;
  for (const callback of callbacks) {
    try {
      callback(delta);
    } catch (error) {
      reportError(error);
    }
  }
  handle = requestAnimationFrame(tick);
}

function subscribeFrame(callback: FrameCallback) {
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
  useEffect(() => {
    latest.current = callback;
  }, [callback]);
  useEffect(() => subscribeFrame((delta) => latest.current(delta)), []);
}
