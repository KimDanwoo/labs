'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { RIVER } from '../../config/scene';
import { bedMaterial, oceanMaterial, TRENCH_WIDTH, waterMaterial } from '../../lib/river/river';
import { riverDetailFor, updateRiver } from '../../lib/river/riverFrame';
import { useRiverFog } from '../../model/hooks/useRiverFog';
import { useLowDetail } from '../../model/ride-state/sceneQuality';
import { RiverBanks } from './RiverBanks';

oceanMaterial.uniforms.uOcean!.value = 1;

export function River() {
  const groupRef = useRef<Group>(null);
  const oceanRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const coarse = useLowDetail();
  const { riverLength, riverSegments, oceanSize, bedWidthSegments, waterWidthSegments } = riverDetailFor(coarse);

  // 안개 범위는 기기별(SceneCanvas의 scene fog와 동일 값).
  useRiverFog(coarse);

  useFrame((state, delta) => {
    const groups = { river: groupRef.current, ocean: oceanRef.current };
    updateRiver(groups, camera, coarse, state.clock.elapsedTime, delta);
  });

  return (
    <>
      <RiverBanks />
      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={bedMaterial} frustumCulled={false}>
          <planeGeometry args={[TRENCH_WIDTH, riverLength, bedWidthSegments, riverSegments]} />
        </mesh>
        <mesh
          position={[0, -RIVER.waterDrop, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={waterMaterial}
          frustumCulled={false}
        >
          <planeGeometry args={[TRENCH_WIDTH, riverLength, waterWidthSegments, riverSegments]} />
        </mesh>
      </group>
      <group ref={oceanRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={oceanMaterial} frustumCulled={false}>
          <planeGeometry args={[oceanSize, oceanSize]} />
        </mesh>
      </group>
    </>
  );
}
