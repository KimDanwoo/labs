import { useEffect, useMemo } from 'react';
import {
  makeCanopyGeometry,
  makeConiferGeometry,
  makeRockGeometry,
  makeShadowTexture,
  makeTrunkGeometry,
} from '../../lib/flora/makeFloraGeometry';
import { makeLeafCanopy } from '../../lib/makeLeafCanopy';
import { makeSurfaceBump, SURFACE_KIND } from '../../lib/makeSurfaceBump';
import { FLORA } from './constants';

export function useFloraResources(coarse: boolean) {
  const geometry = useMemo(
    () => ({
      canopy: makeLeafCanopy(FLORA.canopy.radius, coarse ? 100 : 180),
      farCanopy: makeCanopyGeometry(1),
      conifer: makeConiferGeometry(),
      trunk: makeTrunkGeometry(),
      rock: makeRockGeometry(coarse ? 1 : 2),
    }),
    [coarse],
  );
  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry]);
  const surface = useMemo(
    () => ({ bark: makeSurfaceBump(SURFACE_KIND.bark), stone: makeSurfaceBump(SURFACE_KIND.stone) }),
    [],
  );
  useEffect(() => () => Object.values(surface).forEach((texture) => texture.dispose()), [surface]);
  const shadowTexture = useMemo(() => makeShadowTexture(), []);
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture]);
  return { geometry, surface, shadowTexture };
}
