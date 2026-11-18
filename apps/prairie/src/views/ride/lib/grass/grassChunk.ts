// 시드 기반 결정적 PRNG(mulberry32) — 셀마다 항상 같은 잔디 배치.
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 저주파 군집 노이즈 — 키 큰/낮은 잔디가 자연스러운 덩어리를 이룬다.
export function clumpAt(x: number, z: number): number {
  const s = Math.sin(x * 0.13 + z * 0.07) * Math.cos(x * 0.05 - z * 0.11);
  return s * 0.5 + 0.5;
}
