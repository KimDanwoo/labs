import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SCENE_COLORS } from '@shared/config';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type BufferGeometry, Color, DoubleSide, type Mesh, ShaderMaterial } from 'three';
import {
  chunkSeed,
  GRASS_FADE,
  GRASS_FIELD,
  GRASS_FRAGMENT_SHADER,
  GRASS_MODEL_URL,
  GRASS_VERTEX_SHADER,
} from '../model/constants';
import { GrassChunk } from './GrassChunk';

type Cell = { x: number; z: number };

// ghibli-grass-v2(MIT, © Wilson Ko) 색/바람 + 실제 glb blade를 카메라 주변 청크로만 유지(chunk-follow).
export function GrassField() {
  const { scene } = useGLTF(GRASS_MODEL_URL);
  const materialRef = useRef<ShaderMaterial | null>(null);

  const geometry = useMemo(() => {
    let geo: BufferGeometry | null = null;
    scene.traverse((object) => {
      if (!geo && (object as Mesh).isMesh) geo = (object as Mesh).geometry;
    });
    return geo;
  }, [scene]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uBrightness: { value: 1.12 },
          uHorizonColor: { value: new Color(SCENE_COLORS.fog) },
          uFadeNear: { value: GRASS_FADE.near },
          uFadeFar: { value: GRASS_FADE.far },
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
    const list: Cell[] = [];
    const r = GRASS_FIELD.viewRadius;
    for (let dx = -r; dx <= r; dx += 1) {
      for (let dz = -r; dz <= r; dz += 1) {
        list.push({ x: center.x + dx, z: center.z + dz });
      }
    }
    return list;
  }, [center]);

  useLayoutEffect(() => {
    materialRef.current = material;
  }, [material]);

  useFrame((state) => {
    if (materialRef.current) materialRef.current.uniforms.uTime!.value = state.clock.elapsedTime;
    const cx = Math.round(state.camera.position.x / GRASS_FIELD.tile);
    const cz = Math.round(state.camera.position.z / GRASS_FIELD.tile);
    if (cx !== centerRef.current.x || cz !== centerRef.current.z) {
      centerRef.current = { x: cx, z: cz };
      setCenter({ x: cx, z: cz });
    }
  });

  if (!geometry) return null;

  return (
    <group>
      {cells.map((cell) => (
        <GrassChunk
          key={`${cell.x}:${cell.z}`}
          cellX={cell.x}
          cellZ={cell.z}
          seed={chunkSeed(cell.x, cell.z)}
          geometry={geometry}
          material={material}
        />
      ))}
    </group>
  );
}

useGLTF.preload(GRASS_MODEL_URL);
