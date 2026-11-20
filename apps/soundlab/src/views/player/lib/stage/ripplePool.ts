import { RIPPLE_SLOTS } from '@views/player/config/renderer';
import { RIPPLE_MS } from '@views/player/config/stage';

const RIPPLE_STRIDE = 4;

/**
 * 파동 풀. store의 frameState와 같은 이유로 React 밖에 둔다 — 매 프레임 변하는 값이라
 * ref에 담으면 60fps 리렌더가 나고, effect가 참조하는 ref의 중첩 객체 변형은 컴파일러가 막는다.
 * 무대 캔버스는 앱에 하나뿐이라(아트워크 캐시와 같은 전제) 모듈 스코프로 충분하다.
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

export const rippleBuffer = new Float32Array(RIPPLE_SLOTS * RIPPLE_STRIDE);
export const seedBuffer = new Float32Array(RIPPLE_SLOTS);

/**
 * 가장 오래된(=진행이 많이 된) 슬롯을 재사용한다. 살아 있는 파동을 자르는 걸 마지막으로 미룬다.
 *
 * 비트는 살아 있는 클릭을 절대 밀어내지 않는다. 16분음표가 연달아 오면 비트가 525ms 안에
 * 슬롯 5개를 다 먹는데(시뮬레이션: 클릭 5발이 전부 잘렸다) 클릭은 사용자가 만든 사건이라
 * 끝까지 살아야 한다. 슬롯이 살아 있는 클릭으로 꽉 찼으면 그 비트를 버린다.
 */
export function claimRipple(x: number, y: number, amp: number, life: number, fromClick: boolean) {
  const open = fromClick ? ripples : ripples.filter((candidate) => !(candidate.fromClick && candidate.age < 1));
  if (open.length === 0) return;
  const slot = open.reduce((a, b) => (b.age > a.age ? b : a));
  slot.fromClick = fromClick;
  slot.x = x;
  slot.y = y;
  slot.age = 0;
  slot.amp = amp;
  slot.life = life;
  slot.seed = Math.random();
}

/** 파동을 한 프레임 진행시키고 버퍼를 채운다. 살아 있는 파동의 세기 합을 돌려준다. */
export function advanceRipples(delta: number) {
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
    seedBuffer[slot / RIPPLE_STRIDE] = ripple.seed;
    slot += RIPPLE_STRIDE;
  }
  return energy;
}
