'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { RIVER } from '@views/ride/config/scene';
import { bedMaterial, oceanMaterial, TRENCH_WIDTH, waterMaterial } from '@views/ride/lib/river/river';
import { riverDetailFor, updateRiver } from '@views/ride/lib/river/riverFrame';
import { useRiverFog } from '@views/ride/model/hooks/useRiverFog';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { RiverBanks } from '@views/ride/ui/river/RiverBanks';
import { useRef } from 'react';
import { Group } from 'three';

oceanMaterial.uniforms.uOcean!.value = 1;

export function River() {
  const groupRef = useRef<Group>(null);
  const oceanRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const coarse = useLowDetail();
  const { riverLength, riverSegments, oceanSize, bedWidthSegments, waterWidthSegments } = riverDetailFor(coarse);

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
