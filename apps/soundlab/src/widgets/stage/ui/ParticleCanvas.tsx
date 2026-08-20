'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { artworkUrl } from '@entities/track/model/services';
import { currentIndexAtom, frameState } from '@entities/track/model/store';
import { useFrame } from '@shared/lib/frame';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, type RefObject } from 'react';
import { createRenderer, RIPPLE_SLOTS, type Renderer } from '../lib/renderer';

/** 아트워크는 다른 오리진이므로 crossOrigin 없이는 텍스처 업로드가 보안 오류로 막힌다. */
const images = new Map<number, HTMLImageElement>();

function loadArtwork(index: number): Promise<HTMLImageElement> {
  const cached = images.get(index);
  if (cached) return Promise.resolve(cached);
  const track = TRACKS[index];
  if (!track) return Promise.reject(new Error('트랙이 없습니다'));

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      images.set(index, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error('아트워크를 불러오지 못했습니다'));
    image.src = artworkUrl(track, 't500x500');
  });
}

/** 파동 수명. 짧으면 튕기고, 길면 그림이 계속 일렁여 아트워크가 안 읽힌다. */
const RIPPLE_MS = 900;

/**
 * 파동 풀. store의 frameState와 같은 이유로 React 밖에 둔다 — 매 프레임 변하는 값이라
 * ref에 담으면 60fps 리렌더가 나고, effect가 참조하는 ref의 중첩 객체 변형은 컴파일러가 막는다.
 * 무대 캔버스는 앱에 하나뿐이라(위 images 맵과 같은 전제) 모듈 스코프로 충분하다.
 * age >= 1 이 꺼진 슬롯이다.
 */
const ripples = Array.from({ length: RIPPLE_SLOTS }, () => ({ x: 0, y: 0, age: 1 }));
const rippleBuffer = new Float32Array(RIPPLE_SLOTS * 3);

type ParticleCanvasProps = {
  slotRef: RefObject<HTMLDivElement | null>;
  onReady: (ready: boolean) => void;
};

export function ParticleCanvas({ slotRef, onReady }: ParticleCanvasProps) {
  const index = useAtomValue(currentIndexAtom);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const renderer = useRef<Renderer | null>(null);

  // 전환 상태 기계. 완전히 흩어진 뒤 텍스처를 갈고 다시 모은다.
  const morph = useRef(0.001);
  const want = useRef(0);
  const pending = useRef<number | null>(null);
  const ready = useRef<HTMLImageElement | null>(null);
  const prevMorph = useRef(0);
  const trail = useRef(0);

  useEffect(() => {
    const node = canvas.current;
    const slot = slotRef.current;
    if (!node || !slot) return undefined;

    const instance = createRenderer(node);
    if (!instance) {
      // WebGL2를 못 쓰면 Stage의 img 폴백이 그대로 남는다.
      onReady(false);
      return undefined;
    }
    renderer.current = instance;
    instance.layout(slot.getBoundingClientRect());
    onReady(true);

    const relayout = () => {
      const rect = slotRef.current?.getBoundingClientRect();
      if (rect) instance.layout(rect);
    };
    const observer = new ResizeObserver(relayout);
    observer.observe(slot);
    // 슬롯은 크기가 그대로인 채 위치만 바뀔 수 있다(재생목록 접기 → 무대 열이 넓어짐).
    // ResizeObserver는 위치 변화로는 안 울리므로, 크기가 실제로 변하는 무대 영역도 함께 본다.
    if (slot.parentElement) observer.observe(slot.parentElement);
    window.addEventListener('resize', relayout);

    // 캔버스는 pointer-events-none이라 클릭은 슬롯(아트워크 영역)이 받는다.
    // 셰이더 좌표계는 캔버스 중심 기준·y 위쪽이므로 그에 맞춰 변환한다.
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handlePointerDown = (event: PointerEvent) => {
      if (calm.matches) return;
      const oldest = ripples.reduce((a, b) => (b.age > a.age ? b : a));
      oldest.x = event.clientX - node.clientWidth / 2;
      oldest.y = node.clientHeight / 2 - event.clientY;
      oldest.age = 0;
    };
    slot.addEventListener('pointerdown', handlePointerDown);

    return () => {
      observer.disconnect();
      slot.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', relayout);
      renderer.current = null;
      instance.dispose();
    };
  }, [onReady, slotRef]);

  // 곡이 바뀌면 흩어짐부터 시작한다.
  useEffect(() => {
    pending.current = index;
    want.current = 0;
    ready.current = null;
    loadArtwork(index)
      .then((image) => {
        if (pending.current === index) ready.current = image;
      })
      .catch(() => undefined);
  }, [index]);

  useFrame((delta) => {
    const instance = renderer.current;
    if (!instance) return;
    const step = Math.min(3, delta / 16.7);

    const target = want.current;
    morph.current += (target - morph.current) * (target > morph.current ? 0.038 : 0.075) * step;

    if (target === 0 && morph.current < 0.02 && pending.current !== null && ready.current) {
      instance.setArtwork(ready.current);
      pending.current = null;
      ready.current = null;
      want.current = 1;
    }

    // 트레일은 움직일 때만 남긴다. 집결이 끝나면 감쇠를 0으로 보내 선명해진다.
    const speed = Math.abs(morph.current - prevMorph.current) / Math.max(0.2, step);
    prevMorph.current = morph.current;
    trail.current += (Math.min(1, speed * 140) - trail.current) * 0.14 * step;

    let energy = 0;
    let slot = 0;
    for (const ripple of ripples) {
      if (ripple.age < 1) {
        ripple.age = Math.min(1, ripple.age + delta / RIPPLE_MS);
        energy += 1 - ripple.age;
      }
      rippleBuffer.set([ripple.x, ripple.y, ripple.age], slot);
      slot += 3;
    }

    instance.render({
      morph: morph.current,
      level: frameState.level,
      // 파동이 살아 있는 동안만 트레일을 얹어 물결이 빛 자국을 남기게 한다. 상한은 무한 번짐 방지.
      decay: Math.min(0.88, trail.current * 0.86 + energy * 0.24),
      ripples: rippleBuffer,
    });
  });

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 -z-10 size-full" />;
}
