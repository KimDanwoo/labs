import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import {
  chunkSeed,
  GRASS_FIELD,
  GRASS_QUALITY,
  grassLodForRing,
  grassViewRadius,
  type GrassQuality,
} from '../../model/grass/constants';
import { useDispose } from '../../model/hooks/useDispose';
import { useGrassMaterial } from '../../model/hooks/useGrassMaterial';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

import { gridCells, makeGrassGeometries, updateGrassUniforms, type GrassCell } from '../../lib/grass/grassMaterial';

import { GrassChunk } from './GrassChunk';

interface GrassFieldProps {
  isSoftware: boolean;
}

function useGrassQuality(isSoftware: boolean): GrassQuality {
  const isLowDetail = useLowDetail();
  if (isSoftware) return 'software';
  return isLowDetail ? 'mobile' : 'desktop';
}

// ghibli-grass-v2(MIT, © Wilson Ko) 색/바람 셰이더 + 절차적 blade를 카메라 주변 청크로만 유지(chunk-follow).
// 링은 blade 풀·분할 수만, 보이는 밀도·크기는 셰이더가 거리로 연속 계산(팝 없음). 마지막 링 너머는 Ground의 잔디 무늬가 인상을 이어간다.
export function GrassField({ isSoftware }: GrassFieldProps) {
  const quality = useGrassQuality(isSoftware);
  const viewRadius = grassViewRadius(quality);
  const fullPool = GRASS_QUALITY[quality].rings[0]!.blades;

  // segments별 blade 지오메트리 캐시(링마다 다른 분할 수).
  const geometries = useMemo(() => makeGrassGeometries(quality), [quality]);
  const geometryList = useMemo(() => [...geometries.values()], [geometries]);
  const material = useGrassMaterial(quality);
  useDispose(geometryList);

  const [center, setCenter] = useState<GrassCell>({ x: 0, z: 0 });
  const centerRef = useRef<GrassCell>({ x: 0, z: 0 });
  const cells = useMemo(() => gridCells(center, viewRadius), [center, viewRadius]);

  useFrame((state) => {
    updateGrassUniforms(material, state.clock.elapsedTime);
    const cx = Math.round(state.camera.position.x / GRASS_FIELD.tile);
    const cz = Math.round(state.camera.position.z / GRASS_FIELD.tile);
    if (cx !== centerRef.current.x || cz !== centerRef.current.z) {
      centerRef.current = { x: cx, z: cz };
      setCenter({ x: cx, z: cz });
    }
  });

  return (
    <group>
      {cells.map((cell) => {
        const lod = grassLodForRing(quality, cell.ring);
        return (
          <GrassChunk
            key={`${cell.x}:${cell.z}`}
            cellX={cell.x}
            cellZ={cell.z}
            seed={chunkSeed(cell.x, cell.z)}
            geometry={geometries.get(lod.segments)!}
            material={material}
            bladesPerChunk={lod.blades}
            fullPool={fullPool}
          />
        );
      })}
    </group>
  );
}
