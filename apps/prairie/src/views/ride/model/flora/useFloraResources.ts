import { useMemo } from 'react';
import {
  makeCanopyGeometry,
  makeConiferGeometry,
  makeRockGeometry,
  makeShadowTexture,
  makeTrunkGeometry,
} from '../../lib/flora/makeFloraGeometry';
import { makeLeafCanopy } from '../../lib/makeLeafCanopy';
import { makeSurfaceBump, SURFACE_KIND } from '../../lib/makeSurfaceBump';
import { useDispose } from '../hooks/useDispose';
import { FLORA } from './constants';

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
