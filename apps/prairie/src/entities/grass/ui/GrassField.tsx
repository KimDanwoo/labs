import {
  chunkSeed,
  GRASS_FIELD,
  GRASS_FRAGMENT_SHADER,
  GRASS_QUALITY,
  GRASS_VERTEX_SHADER,
  grassLodForRing,
  grassViewRadius,
  GUST,
  makeBladeGeometry,
  type GrassQuality,
} from '@entities/grass/model/constants';
import { useFrame } from '@react-three/fiber';
import { FOG, SCENE_COLORS } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { runnerState } from '@shared/r3f';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Color, DoubleSide, ShaderMaterial, Vector2, type BufferGeometry } from 'three';
import { GrassChunk } from './GrassChunk';

type Cell = { x: number; z: number };

const runnerXZUniform = new Vector2();
const gustOriginUniform = new Vector2();

// ghibli-grass-v2(MIT, © Wilson Ko) 색/바람 셰이더 + 절차적 blade를 카메라 주변 청크로만 유지(chunk-follow).
// 링은 blade 풀·분할 수만, 보이는 밀도·크기는 셰이더가 거리로 연속 계산(팝 없음). 마지막 링 너머는 Ground의 잔디 무늬가 인상을 이어간다.
export function GrassField() {
  const coarse = useIsCoarsePointer();
  const quality: GrassQuality = coarse ? 'mobile' : 'desktop';
  const { fadeNear, fadeFar } = GRASS_QUALITY[quality];
  const viewRadius = grassViewRadius(quality);
  const fullPool = GRASS_QUALITY[quality].rings[0]!.blades;
  const materialRef = useRef<ShaderMaterial | null>(null);

  // segments별 blade 지오메트리 캐시(링마다 다른 분할 수).
  const geometries = useMemo(() => {
    const map = new Map<number, BufferGeometry>();
    GRASS_QUALITY[quality].rings.forEach((lod) => {
      if (!map.has(lod.segments)) map.set(lod.segments, makeBladeGeometry(lod.segments));
    });
    return map;
  }, [quality]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uRunnerXZ: { value: runnerXZUniform },
          uRunnerAir: { value: 0 },
          uGustOrigin: { value: gustOriginUniform },
          // 음수 = 돌풍 없음. 끝난 돌풍은 duration으로 잘라 무한대 유니폼을 피한다.
          uGustAge: { value: -1 },
          uBrightness: { value: 1.12 },
          uHorizonColor: { value: new Color(SCENE_COLORS.fog) },
          uGroundColor: { value: new Color(SCENE_COLORS.grass) },
          uFogNear: { value: FOG.desktop.near },
          uFogFar: { value: FOG.desktop.far },
          uFadeNear: { value: GRASS_QUALITY.desktop.fadeNear },
          uFadeFar: { value: GRASS_QUALITY.desktop.fadeFar },
        },
        vertexShader: GRASS_VERTEX_SHADER,
        fragmentShader: GRASS_FRAGMENT_SHADER,
        side: DoubleSide,
      }),
    [],
  );

  const [center, setCenter] = useState<Cell>({ x: 0, z: 0 });
  const centerRef = useRef<Cell>({ x: 0, z: 0 });

  const cells = useMemo(() => {
    const list: (Cell & { ring: number })[] = [];
    for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
      for (let dz = -viewRadius; dz <= viewRadius; dz += 1) {
        list.push({ x: center.x + dx, z: center.z + dz, ring: Math.max(Math.abs(dx), Math.abs(dz)) });
      }
    }
    return list;
  }, [center, viewRadius]);

  useLayoutEffect(() => {
    materialRef.current = material;
  }, [material]);

  useLayoutEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uFadeNear!.value = fadeNear;
    mat.uniforms.uFadeFar!.value = fadeFar;
    mat.uniforms.uFogNear!.value = FOG[quality].near;
    mat.uniforms.uFogFar!.value = FOG[quality].far;
  }, [fadeNear, fadeFar, quality]);

  useFrame((state) => {
    const mat = materialRef.current;
    if (mat) {
      const elapsed = state.clock.elapsedTime;
      mat.uniforms.uTime!.value = elapsed;
      runnerXZUniform.set(runnerState.position.x, runnerState.position.z);
      mat.uniforms.uRunnerAir!.value = runnerState.airborneHeight;
      gustOriginUniform.copy(runnerState.gustOrigin);
      const gustAge = runnerState.gustStartedAt < 0 ? -1 : elapsed - runnerState.gustStartedAt;
      mat.uniforms.uGustAge!.value = gustAge > GUST.duration ? -1 : gustAge;
    }
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
