import { useMemo } from 'react';
import { GARDEN_COLUMN } from '../../config/gardenColumn';
import { makeGardenColumn } from '../../lib/exploration/makeGardenColumn';
import { makeSurfaceBump, SURFACE_KIND } from '../../lib/makeSurfaceBump';
import { useDispose } from '../../model/hooks/useDispose';

interface GardenColumnProps {
  height: number;
}

export function GardenColumn({ height }: GardenColumnProps) {
  const { shaft, cap } = GARDEN_COLUMN;
  const surface = useMemo(() => makeSurfaceBump(SURFACE_KIND.stone), []);
  const geometry = useMemo(() => makeGardenColumn(height), [height]);
  useDispose(geometry);
  useDispose(surface);
  return (
    <group>
      <mesh geometry={geometry.shaft} castShadow receiveShadow>
        <meshStandardMaterial
          color={shaft.color}
          roughness={shaft.roughness}
          bumpMap={surface}
          bumpScale={shaft.bumpScale}
        />
      </mesh>
      <mesh
        geometry={geometry.cap}
        position={[cap.offset.x, height + cap.offset.y, 0]}
        rotation={cap.rotation}
        castShadow
      >
        <meshStandardMaterial color={cap.color} roughness={cap.roughness} bumpMap={surface} bumpScale={cap.bumpScale} />
      </mesh>
    </group>
  );
}
