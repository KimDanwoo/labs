import { useEffect, useMemo } from 'react';
import { LatheGeometry, Vector2 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeSurfaceBump, SURFACE_KIND } from '../../lib/makeSurfaceBump';

export function GardenColumn({ height }: { height: number }) {
  const surface = useMemo(() => makeSurfaceBump(SURFACE_KIND.stone), []);
  const geometry = useMemo(() => {
    const shaft = new LatheGeometry(
      [
        new Vector2(1, 0),
        new Vector2(1, 0.15),
        new Vector2(0.86, 0.25),
        new Vector2(0.74, 0.4),
        new Vector2(0.67, height - 0.5),
        new Vector2(0.8, height - 0.35),
        new Vector2(0.94, height - 0.25),
        new Vector2(0.94, height),
      ],
      32,
    );
    const points = shaft.getAttribute('position');
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i),
        y = points.getY(i),
        z = points.getZ(i);
      const flute = 1 - Math.sin(Math.atan2(z, x) * 8) ** 2 * 0.035 * Math.sin((y / height) * Math.PI);
      points.setXYZ(i, x * flute, y, z * flute);
    }
    shaft.computeVertexNormals();
    return { shaft, cap: new RoundedBoxGeometry(1.9, 0.35, 1.8, 2, 0.09) };
  }, [height]);
  useEffect(
    () => () => {
      Object.values(geometry).forEach((part) => part.dispose());
    },
    [geometry],
  );
  useEffect(() => () => surface.dispose(), [surface]);
  return (
    <group>
      <mesh geometry={geometry.shaft} castShadow receiveShadow>
        <meshStandardMaterial color="#aaa993" roughness={0.9} bumpMap={surface} bumpScale={0.08} />
      </mesh>
      <mesh geometry={geometry.cap} position={[0.1, height + 0.1, 0]} rotation={[0.05, 0.15, 0.04]} castShadow>
        <meshStandardMaterial color="#c2bba4" roughness={0.9} bumpMap={surface} bumpScale={0.06} />
      </mesh>
    </group>
  );
}
