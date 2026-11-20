import { useFrame } from '@react-three/fiber';
import {
  chunkSeed,
  GRASS_FIELD,
  GRASS_QUALITY,
  grassLodForRing,
  grassViewRadius,
  type GrassQuality,
} from '@views/ride/model/grass/constants';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useGrassMaterial } from '@views/ride/model/hooks/useGrassMaterial';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { useMemo, useRef, useState } from 'react';

import {
  gridCells,
  makeGrassGeometries,
  updateGrassUniforms,
  type GrassCell,
} from '@views/ride/lib/grass/grassMaterial';

import { GrassChunk, type GrassChunkAssets } from '@views/ride/ui/grass/GrassChunk';

interface GrassFieldProps {
  isSoftware: boolean;
}

function useGrassQuality(isSoftware: boolean): GrassQuality {
  const isLowDetail = useLowDetail();
  if (isSoftware) return 'software';
  return isLowDetail ? 'mobile' : 'desktop';
}

export function GrassField({ isSoftware }: GrassFieldProps) {
  const quality = useGrassQuality(isSoftware);
  const viewRadius = grassViewRadius(quality);
  const fullPool = GRASS_QUALITY[quality].rings[0]!.blades;

  const geometries = useMemo(() => makeGrassGeometries(quality), [quality]);
  const geometryList = useMemo(() => [...geometries.values()], [geometries]);
  const material = useGrassMaterial(quality);
  useDispose(geometryList);
  const assets = useMemo<GrassChunkAssets>(
    () => ({ geometries, material, fullPool }),
    [geometries, material, fullPool],
  );

  const [center, setCenter] = useState<GrassCell>({ x: 0, z: 0 });
  const centerRef = useRef<GrassCell>({ x: 0, z: 0 });
  const cells = useMemo(() => gridCells(center, viewRadius), [center, viewRadius]);

  useFrame((state) => {
    updateGrassUniforms(material, state.clock.elapsedTime);
    const cx = Math.round(state.camera.position.x / GRASS_FIELD.tile);
    const cz = Math.round(state.camera.position.z / GRASS_FIELD.tile);
    const hasMovedCell = cx !== centerRef.current.x || cz !== centerRef.current.z;
    if (hasMovedCell) {
      centerRef.current = { x: cx, z: cz };
      setCenter({ x: cx, z: cz });
    }
  });

  return (
    <group>
      {cells.map((cell) => (
        <GrassChunk
          key={`${cell.x}:${cell.z}`}
          cellX={cell.x}
          cellZ={cell.z}
          seed={chunkSeed(cell.x, cell.z)}
          lod={grassLodForRing(quality, cell.ring)}
          assets={assets}
        />
      ))}
    </group>
  );
}
