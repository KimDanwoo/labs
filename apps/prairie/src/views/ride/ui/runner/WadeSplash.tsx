'use client';

import { useFrame } from '@react-three/fiber';
import { WADE_SPLASH_VIEW } from '@views/ride/config/wadeSplashView';
import { maxDroplets } from '@views/ride/lib/runner/wadeSplash';
import { createRingMaterials, createWadeState, stepWadeSplash } from '@views/ride/lib/runner/wadeSplashStep';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Mesh } from 'three';

// 물보라(속도 방향으로 늘어난 물줄기, world 공간) + 발굽에서 퍼지는 파문 링. 죽은 입자·링은 크기 0.
export function WadeSplash() {
  const dropletsRef = useRef<InstancedMesh>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const state = useMemo(() => createWadeState(), []);
  const materials = useMemo(() => createRingMaterials(), []);

  useFrame((_state, rawDelta) => {
    if (!dropletsRef.current) return;
    stepWadeSplash(state, dropletsRef.current, { meshes: ringRefs.current, materials }, rawDelta);
  });

  return (
    <>
      <instancedMesh ref={dropletsRef} args={[undefined, undefined, maxDroplets]} frustumCulled={false}>
        <sphereGeometry args={WADE_SPLASH_VIEW.dropletGeometry} />
        <meshBasicMaterial color="#f2f9fc" transparent opacity={WADE_SPLASH_VIEW.dropletOpacity} />
      </instancedMesh>
      {materials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0}
          material={material}
        >
          <ringGeometry args={WADE_SPLASH_VIEW.ringGeometry} />
        </mesh>
      ))}
    </>
  );
}
