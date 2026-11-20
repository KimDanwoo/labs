import { applyGrassQuality, makeGrassMaterial } from '@views/ride/lib/grass/grassMaterial';
import type { GrassQuality } from '@views/ride/model/grass/constants';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useLayoutEffect, useMemo } from 'react';
import type { ShaderMaterial } from 'three';

export function useGrassMaterial(quality: GrassQuality): ShaderMaterial {
  const material = useMemo(() => makeGrassMaterial(), []);
  useDispose(material);
  useLayoutEffect(() => {
    applyGrassQuality(material, quality);
  }, [material, quality]);
  return material;
}
