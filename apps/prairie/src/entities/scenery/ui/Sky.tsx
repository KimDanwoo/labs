import { Environment } from '@react-three/drei';

const CUBE_FACES = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

// 원본 큐브맵은 물 반사에도 유지하고 배경만 부드럽게 처리한다.
export function Sky() {
  return <Environment background backgroundBlurriness={0.025} path="/assets/cubeMap/" files={CUBE_FACES} />;
}
