import { useLayoutEffect, useMemo } from 'react';
import type { ShaderMaterial } from 'three';
import { applyGrassQuality, makeGrassMaterial } from '../../lib/grass/grassMaterial';
import type { GrassQuality } from '../grass/constants';
import { useDispose } from './useDispose';

export function useGrassMaterial(quality: GrassQuality): ShaderMaterial {
  const material = useMemo(() => makeGrassMaterial(), []);
  useDispose(material);
  useLayoutEffect(() => {
    applyGrassQuality(material, quality);
  }, [material, quality]);
  return material;
}
