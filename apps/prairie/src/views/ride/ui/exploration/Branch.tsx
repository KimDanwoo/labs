'use client';
import { BRANCH } from '@views/ride/config/branch';
import { makeSurfaceBump, SURFACE_KIND } from '@views/ride/lib/makeSurfaceBump';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';

interface BranchProps {
  points: readonly (readonly number[])[];
  radius?: number;
  color?: string;
}

export function Branch({ points, radius = BRANCH.defaultRadius, color = BRANCH.defaultColor }: BranchProps) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(p[0], p[1], p[2]))), [points]);
  const bark = useMemo(() => makeSurfaceBump(SURFACE_KIND.bark), []);
  useDispose(bark);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, BRANCH.tubularSegments, radius, BRANCH.radialSegments, false]} />
      <meshStandardMaterial
        color={color}
        roughness={BRANCH.roughness}
        bumpMap={bark}
        bumpScale={radius * BRANCH.bumpRatio}
      />
    </mesh>
  );
}
