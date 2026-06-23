'use client';

import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { useMemo } from 'react';

type GltfModelProps = {
  url: string;
} & ThreeElements['group'];

// 외부 .glb를 불러오는 슬롯. clone(true)로 같은 모델을 여러 번 배치해도 안전하다.
// 두 번째 인자 true → draco 압축 모델도 지원(디코더는 필요 시에만 로드).
export function GltfModel({ url, ...groupProps }: GltfModelProps) {
  const { scene } = useGLTF(url, true);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <group {...groupProps}>
      <primitive object={cloned} />
    </group>
  );
}

export function preloadGltf(url: string): void {
  useGLTF.preload(url, true);
}
