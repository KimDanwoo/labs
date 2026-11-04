'use client';
import { makeSurfaceBump, SURFACE_KIND } from '@shared/lib';
import { useEffect, useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';

export function Branch({
  points,
  radius = 0.3,
  color = '#786a52',
}: {
  points: number[][];
  radius?: number;
  color?: string;
}) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(p[0], p[1], p[2]))), [points]);
  const bark = useMemo(() => makeSurfaceBump(SURFACE_KIND.bark), []);
  useEffect(() => () => bark.dispose(), [bark]);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 16, radius, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.95} bumpMap={bark} bumpScale={radius * 0.25} />
    </mesh>
  );
}
