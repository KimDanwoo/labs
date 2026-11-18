'use client';

import { Environment } from '@react-three/drei';
import { useIsCoarsePointer } from '@shared/lib/useCoarsePointer';
import { SKY_ROTATION } from '../../lib/scenery/sky';

export function Sky() {
  const coarse = useIsCoarsePointer();
  return (
    <Environment
      background
      files={coarse ? '/environments/golden-meadow-1k.hdr' : '/environments/golden-meadow-2k.hdr'}
      environmentIntensity={0.65}
      environmentRotation={SKY_ROTATION}
      backgroundRotation={SKY_ROTATION}
      backgroundBlurriness={0}
    />
  );
}
