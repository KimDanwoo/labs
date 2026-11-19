'use client';

import { Environment } from '@react-three/drei';
import { useIsCoarsePointer } from '@shared/lib/useCoarsePointer';
import { SKY_FILES } from '../../config/scene';
import { SKY_ROTATION } from '../../lib/scenery/sky';

export function Sky() {
  const coarse = useIsCoarsePointer();
  return (
    <Environment
      background
      files={coarse ? SKY_FILES.coarse : SKY_FILES.fine}
      environmentIntensity={0.65}
      environmentRotation={SKY_ROTATION}
      backgroundRotation={SKY_ROTATION}
      backgroundBlurriness={0}
    />
  );
}
