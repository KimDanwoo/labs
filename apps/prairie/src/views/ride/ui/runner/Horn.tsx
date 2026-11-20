import { HORN_VIEW } from '@views/ride/config/hornView';
import { makeHorn } from '@views/ride/lib/runner/makeHorn';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { HORN } from '@views/ride/model/runner/constants';
import { useMemo } from 'react';

export function Horn() {
  const geometry = useMemo(() => makeHorn(), []);
  useDispose(geometry);
  const { ring, gem, body, ridge } = HORN_VIEW;
  return (
    <group scale={HORN.boneScaleFix}>
      <group position={HORN.position} rotation={[Math.PI / 2 - HORN.tiltForward, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[HORN.radius * ring.radiusScale, ring.tube, ring.radialSegments, ring.tubularSegments]}
          />
          <meshStandardMaterial color={HORN.color} roughness={ring.roughness} metalness={ring.metalness} />
        </mesh>
        <mesh position={[0, gem.y, HORN.radius * gem.zRadiusScale]} scale={gem.scale}>
          <octahedronGeometry args={HORN_VIEW.gemGeometry} />
          <meshPhysicalMaterial color={gem.color} metalness={gem.metalness} roughness={gem.roughness} clearcoat={1} />
        </mesh>
        <mesh geometry={geometry.body}>
          <meshStandardMaterial color={HORN.color} roughness={body.roughness} metalness={body.metalness} />
        </mesh>
        <mesh geometry={geometry.ridge}>
          <meshStandardMaterial color={HORN.ridgeColor} roughness={ridge.roughness} metalness={ridge.metalness} />
        </mesh>
      </group>
    </group>
  );
}
