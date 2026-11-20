import {
  makeCanopyGeometry,
  makeConiferGeometry,
  makeRockGeometry,
  makeShadowTexture,
  makeTrunkGeometry,
} from '@views/ride/lib/flora/makeFloraGeometry';
import { makeLeafCanopy } from '@views/ride/lib/makeLeafCanopy';
import { makeSurfaceBump, SURFACE_KIND } from '@views/ride/lib/makeSurfaceBump';
import { FLORA } from '@views/ride/model/flora/constants';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useMemo } from 'react';

export function useFloraResources(coarse: boolean) {
  const geometry = useMemo(
    () => ({
      canopy: makeLeafCanopy(FLORA.canopy.radius, coarse ? FLORA.canopy.leaves.mobile : FLORA.canopy.leaves.desktop),
      farCanopy: makeCanopyGeometry(1),
      conifer: makeConiferGeometry(),
      trunk: makeTrunkGeometry(),
      rock: makeRockGeometry(coarse ? 1 : 2),
    }),
    [coarse],
  );
  useDispose(geometry);
  const surface = useMemo(
    () => ({ bark: makeSurfaceBump(SURFACE_KIND.bark), stone: makeSurfaceBump(SURFACE_KIND.stone) }),
    [],
  );
  useDispose(surface);
  const shadowTexture = useMemo(() => makeShadowTexture(), []);
  useDispose(shadowTexture);
  return { geometry, surface, shadowTexture };
}
