/**
 * 동시에 살아 있는 파동 수. 1개면 연타할 때 앞 파동이 잘려 튄다.
 * 클릭만 쓰던 때는 3이면 됐지만, 비트마다 파동이 나면 킥 간격(실측 평균 538ms) 안에
 * 앞 파동이 아직 살아 있어 슬롯이 모자란다 — 클릭이 밀려 죽지 않게 늘렸다.
 */
export const RIPPLE_SLOTS = 5;

export const BACKGROUND: readonly [number, number, number] = [5 / 255, 6 / 255, 7 / 255];
export const IDLE_RIPPLES = new Float32Array(Array.from({ length: RIPPLE_SLOTS }, () => [0, 0, 1, 0]).flat());
export const IDLE_SEEDS = new Float32Array(RIPPLE_SLOTS);
export const GRID_MIN = 120;
export const GRID_MAX = 288;
export const BLOOM_THRESHOLD = 0.7;
export const BLOOM_BASE = 0.5;
export const BLOOM_PER_SWELL = 0.35;
export const BLOOM_PER_HIT = 0.5;
export const THRESHOLD_PER_HIT = 0.12;
export const DEPTH_BASE = 0.12;
export const DEPTH_PER_SWELL = 0.06;
export const SIZE_PER_HIT = 0.34;
/**
 * 고역 채널 = 하이햇·공기감(원곡 분석 신호가 있는 곡에서만 0이 아니다). 블룸으로 번진다.
 * 0.45에서 평상 변동 96%(0.61~1.20). 절정+비트가 겹친 이론상 최대는 1.80.
 * 저역(킥)은 어느 채널에도 안 물린다 — 깊이에 물렸을 땐 커버가 앞뒤로 튕겨 뺐다.
 */
export const BLOOM_PER_AIR = 0.45;
/** 블룸 타깃 축소 배율(비트 시프트). 블룸은 저주파라 1/4 해상도로도 눈에 안 띄고 필레이트가 4배 싸다. */
export const BLOOM_SHIFT = 2;
export const BLUR_PX = 2.8;
/**
 * 렌더 픽셀 상한. 4K·5K에서 dpr 2를 그대로 쓰면 필레이트만으로 프레임 예산을 넘긴다.
 * 파티클은 셰이더에서 자체 AA되고 블룸이 덮으므로 dpr을 내려도 거의 티가 안 난다 —
 * 점 테두리 선명도와 맞바꾸는 값이니, 더 선명하게 원하면 올린다.
 */
export const MAX_DEVICE_PIXELS = 3500000;
/**
 * 입력이 이만큼도 안 변했으면 그 프레임은 그리지 않는다(정지·수렴 상태에서 파이프라인 전체가 쉰다).
 * morph는 위치로 환산해서 잡은 값 — 흩어진 거리 ~3000px × 5e-5 ≈ 0.15px, 서브픽셀이라 안 보인다.
 * level은 호흡 배율에만 쓰여 0.01 변화가 화면에서 0.04px 이하다.
 */
export const MORPH_EPSILON = 5e-5;
export const LEVEL_EPSILON = 0.01;
/** 이 이하의 감쇠는 트레일을 지운 것과 같다 — 누적 버퍼가 더 안 변하므로 프레임을 건너뛸 수 있다. */
export const STATIC_DECAY = 0.02;
