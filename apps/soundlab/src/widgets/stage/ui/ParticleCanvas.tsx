import { TRACKS } from '@entities/track/model/constants';
import { artworkUrl } from '@entities/track/model/services';
import { currentIndexAtom, frameState } from '@entities/track/model/store';
import { useFrame } from '@shared/lib/frame';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, type RefObject } from 'react';
import { createRenderer, RIPPLE_SLOTS, type Renderer } from '../lib/renderer';

/**
 * 아트워크는 다른 오리진이므로 crossOrigin 없이는 텍스처 업로드가 보안 오류로 막힌다.
 * 이미지가 아니라 약속을 캐시한다 — 선반입과 실제 전환이 겹쳐도 두 번 받지 않는다.
 */
const images = new Map<number, Promise<HTMLImageElement>>();

function loadArtwork(index: number): Promise<HTMLImageElement> {
  const cached = images.get(index);
  if (cached) return cached;
  const track = TRACKS[index];
  if (!track) return Promise.reject(new Error('트랙이 없습니다'));

  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('아트워크를 불러오지 못했습니다'));
    image.src = artworkUrl(track, 't500x500');
  });
  images.set(index, loading);
  // 실패한 약속을 캐시에 남기면 그 곡은 영구히 못 받는다. 다음 시도에 다시 받게 비운다.
  loading.catch(() => images.delete(index));
  return loading;
}

/** 다음·이전 곡을 미리 받아둔다. 전환 순간 파티클이 흩어진 채 네트워크를 기다리지 않게. */
function warmNeighbors(index: number) {
  for (const offset of [1, -1]) {
    loadArtwork((index + offset + TRACKS.length) % TRACKS.length).catch(() => undefined);
  }
}

/** 파동 수명. 짧으면 튕기고, 길면 그림이 계속 일렁여 아트워크가 안 읽힌다. */
const RIPPLE_MS = 900;
/**
 * 비트 파동은 클릭보다 짧고 약하다. 킥 간격이 실측 평균 538ms인데 클릭 수명(900ms)을 그대로 주면
 * 파면이 겹쳐 그림이 계속 일렁이고, 진폭도 클릭과 같으면 아트워크가 안 읽힌다.
 * 세기에 비례해 이 값까지 쓴다. 상한은 0.7 — 2D 야코비안으로 재보니 무작위 원점 + 클릭 동시에
 * 최소 고유값이 0.42에서 +0.29, 0.7에서 +0.165, 1.0에서 -0.145(접힘)였다. 여유 16%를 남긴 값이다.
 */
const BEAT_RIPPLE_MS = 480;
const BEAT_RIPPLE_AMP = 0.7;
/**
 * 비트 파동이 태어나는 자리 — 액자 안 무작위. 액자 반폭에 이 비율을 곱한 범위에서 고른다.
 * 한 자리에서만 나면 같은 그림이 반복되고, 원점이 매번 다르면 파면이 겹칠 일도 줄어
 * 좌표 접힘 여유가 늘어난다(측정: 클릭+비트 4발 동시에도 도함수 -0.64, 한계 -1).
 * 1에 가까울수록 테두리에서 태어나 반쪽 링이 되니 안쪽으로 물린다.
 */
const BEAT_RIPPLE_SPREAD = 0.62;

/**
 * 파동 풀. store의 frameState와 같은 이유로 React 밖에 둔다 — 매 프레임 변하는 값이라
 * ref에 담으면 60fps 리렌더가 나고, effect가 참조하는 ref의 중첩 객체 변형은 컴파일러가 막는다.
 * 무대 캔버스는 앱에 하나뿐이라(위 images 맵과 같은 전제) 모듈 스코프로 충분하다.
 * age >= 1 이 꺼진 슬롯이다.
 */
const ripples = Array.from({ length: RIPPLE_SLOTS }, () => ({
  x: 0,
  y: 0,
  age: 1,
  amp: 1,
  life: RIPPLE_MS,
  seed: 0,
  fromClick: false,
}));
const rippleBuffer = new Float32Array(RIPPLE_SLOTS * 4);
const seedBuffer = new Float32Array(RIPPLE_SLOTS);

/**
 * 가장 오래된(=진행이 많이 된) 슬롯을 재사용한다. 살아 있는 파동을 자르는 걸 마지막으로 미룬다.
 *
 * 비트는 살아 있는 클릭을 절대 밀어내지 않는다. 16분음표가 연달아 오면 비트가 525ms 안에
 * 슬롯 5개를 다 먹는데(시뮬레이션: 클릭 5발이 전부 잘렸다) 클릭은 사용자가 만든 사건이라
 * 끝까지 살아야 한다. 슬롯이 살아 있는 클릭으로 꽉 찼으면 그 비트를 버린다.
 */
function claim(x: number, y: number, amp: number, life: number, fromClick: boolean) {
  const open = fromClick ? ripples : ripples.filter((candidate) => !(candidate.fromClick && candidate.age < 1));
  if (open.length === 0) return;
  const slot = open.reduce((a, b) => (b.age > a.age ? b : a));
  slot.fromClick = fromClick;
  slot.x = x;
  slot.y = y;
  slot.age = 0;
  slot.amp = amp;
  slot.life = life;
  // 파동마다 다른 시드 — 셰이더가 전파 속도와 파면 폭을 여기서 흔든다.
  slot.seed = Math.random();
}

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
  // 비트 파동이 태어날 액자 영역. 셰이더 좌표(캔버스 중심 기준·y 위쪽)로 미리 변환해 둔다.
  const frame = useRef({ x: 0, y: 0, half: 0 });
  const seenBeat = useRef(0);
  const calmRef = useRef(false);

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

    const relayout = () => {
      const rect = slotRef.current?.getBoundingClientRect();
      if (!rect) return;
      instance.layout(rect);
      frame.current = {
        x: rect.left + rect.width / 2 - node.clientWidth / 2,
        y: node.clientHeight / 2 - (rect.top + rect.height / 2),
        half: rect.width / 2,
      };
    };
    relayout();
    onReady(true);
    const observer = new ResizeObserver(relayout);
    observer.observe(slot);
    // 슬롯은 크기가 그대로인 채 위치만 바뀔 수 있다(재생목록 접기 → 무대 열이 넓어짐).
    // ResizeObserver는 위치 변화로는 안 울리므로, 크기가 실제로 변하는 무대 영역도 함께 본다.
    if (slot.parentElement) observer.observe(slot.parentElement);
    window.addEventListener('resize', relayout);

    // 캔버스는 pointer-events-none이라 클릭은 슬롯(아트워크 영역)이 받는다.
    // 셰이더 좌표계는 캔버스 중심 기준·y 위쪽이므로 그에 맞춰 변환한다.
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    calmRef.current = calm.matches;
    const readCalm = () => {
      calmRef.current = calm.matches;
    };
    calm.addEventListener('change', readCalm);
    const handlePointerDown = (event: PointerEvent) => {
      if (calm.matches) return;
      claim(event.clientX - node.clientWidth / 2, node.clientHeight / 2 - event.clientY, 1, RIPPLE_MS, true);
    };
    slot.addEventListener('pointerdown', handlePointerDown);

    return () => {
      observer.disconnect();
      calm.removeEventListener('change', readCalm);
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
        warmNeighbors(index);
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

    // 비트가 왔으면 액자 안 무작위 자리에서 파동을 쏜다. 세기에 비례한 진폭이라 약한 박은 약하게 퍼진다.
    if (frameState.beatId !== seenBeat.current) {
      seenBeat.current = frameState.beatId;
      if (!calmRef.current) {
        const { x, y, half } = frame.current;
        const reach = half * BEAT_RIPPLE_SPREAD;
        claim(
          x + (Math.random() * 2 - 1) * reach,
          y + (Math.random() * 2 - 1) * reach,
          frameState.beatStrength * BEAT_RIPPLE_AMP,
          BEAT_RIPPLE_MS,
          false,
        );
      }
    }

    let energy = 0;
    let slot = 0;
    for (const ripple of ripples) {
      if (ripple.age < 1) {
        ripple.age = Math.min(1, ripple.age + delta / ripple.life);
        energy += (1 - ripple.age) * ripple.amp;
      }
      // set([...])은 프레임마다 배열을 하나씩 만든다. 직접 넣어 할당을 없앤다.
      rippleBuffer[slot] = ripple.x;
      rippleBuffer[slot + 1] = ripple.y;
      rippleBuffer[slot + 2] = ripple.age;
      rippleBuffer[slot + 3] = ripple.amp;
      seedBuffer[slot / 4] = ripple.seed;
      slot += 4;
    }

    instance.render({
      morph: morph.current,
      level: frameState.level,
      swell: frameState.swell,
      pre: frameState.pre,
      hit: frameState.hit,
      air: frameState.air,
      // 파동이 살아 있는 동안만 트레일을 얹어 물결이 빛 자국을 남기게 한다. 상한은 무한 번짐 방지.
      decay: Math.min(0.88, trail.current * 0.86 + energy * 0.24),
      ripples: rippleBuffer,
      rippleSeeds: seedBuffer,
    });
  });

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 -z-10 size-full" />;
}
