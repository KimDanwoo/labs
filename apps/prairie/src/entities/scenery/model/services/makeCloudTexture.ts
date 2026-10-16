import { DataTexture, LinearFilter, RedFormat, RepeatWrapping } from 'three';

// 주기적 노이즈를 한 번 구워 하늘의 프레임별 비용을 텍스처 두 번으로 제한한다.
export function makeCloudTexture() {
  const size = 256;
  const data = new Uint8Array(size * size);
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0;
      let weight = 0;
      for (let octave = 0; octave < 5; octave += 1) {
        const cells = 4 * 2 ** octave;
        const px = (x / size) * cells,
          py = (y / size) * cells;
        const ix = Math.floor(px),
          iy = Math.floor(py);
        const fx = px - ix,
          fy = py - iy;
        const tx = fx * fx * (3 - 2 * fx),
          ty = fy * fy * (3 - 2 * fy);
        const a = hash(ix % cells, iy % cells),
          b = hash((ix + 1) % cells, iy % cells);
        const c = hash(ix % cells, (iy + 1) % cells),
          d = hash((ix + 1) % cells, (iy + 1) % cells);
        const amplitude = 0.5 ** octave;
        sum += ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty) * amplitude;
        weight += amplitude;
      }
      data[y * size + x] = Math.round((sum / weight) * 255);
    }
  }
  const texture = new DataTexture(data, size, size, RedFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
