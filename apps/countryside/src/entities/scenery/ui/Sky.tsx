import { Environment } from '@react-three/drei';

const CUBE_FACES = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

// 원본 ghibli-grass-v2의 큐브맵 스카이박스 — 쨍한 파란 하늘 + 사실적 뭉게구름.
export function Sky() {
  return <Environment background path="/assets/cubeMap/" files={CUBE_FACES} />;
}
