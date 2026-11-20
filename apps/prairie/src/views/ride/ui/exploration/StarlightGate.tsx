'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, DoubleSide, type ShaderMaterial } from 'three';
import { STARLIGHT_GATE } from '../../config/starlightGate';
import { fragmentShader, vertexShader } from '../../lib/exploration/starlightGate';
import { GATE_RADIUS } from '../../model/exploration/world';

interface StarlightGateProps {
  active: boolean;
  index: number;
}

export function StarlightGate({ active, index }: StarlightGateProps) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uActive: { value: 0 } }), []);
  const { ring, plane } = STARLIGHT_GATE;
  const look = active ? STARLIGHT_GATE.active : STARLIGHT_GATE.idle;
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime!.value = clock.elapsedTime + index * STARLIGHT_GATE.timeOffset;
    material.current.uniforms.uActive!.value = active ? 1 : 0;
  });
  return (
    <group>
      <mesh>
        <torusGeometry args={[GATE_RADIUS, ring.tube, ring.radialSegments, ring.tubularSegments]} />
        <meshBasicMaterial color={look.color} transparent opacity={look.opacity} />
      </mesh>
      <mesh>
        <planeGeometry args={plane} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
