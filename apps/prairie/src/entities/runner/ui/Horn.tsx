import { HORN } from '@entities/runner/model/constants';
import { useMemo } from 'react';
import { CatmullRomCurve3, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three';

export function Horn() {
  const geometry = useMemo(() => {
    const profile = Array.from({ length: 17 }, (_, i) => {
      const t = i / 16;
      return new Vector2(HORN.radius * Math.pow(1 - t, 0.85), t * HORN.height);
    });
    const body = new LatheGeometry(profile, 24);
    const points = body.getAttribute('position');
    for (let i = 0; i < points.count; i += 1) {
      const t = points.getY(i) / HORN.height;
      points.setZ(i, points.getZ(i) - HORN.bend * t * t);
    }
    body.computeVertexNormals();
    const spiral = Array.from({ length: 100 }, (_, i) => {
      const t = (i / 99) * 0.96;
      const r = HORN.radius * Math.pow(1 - t, 0.85);
      const angle = t * Math.PI * 2 * 4;
      return new Vector3(Math.cos(angle) * r, t * HORN.height, Math.sin(angle) * r - HORN.bend * t * t);
    });
    return { body, ridge: new TubeGeometry(new CatmullRomCurve3(spiral), 100, 0.003, 4, false) };
  }, []);
  return (
    <group scale={HORN.boneScaleFix}>
      <group position={HORN.position} rotation={[Math.PI / 2 - HORN.tiltForward, 0, 0]}>
        <mesh geometry={geometry.body}>
          <meshStandardMaterial color={HORN.color} roughness={0.64} metalness={0.08} />
        </mesh>
        <mesh geometry={geometry.ridge}>
          <meshStandardMaterial color={HORN.ridgeColor} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
