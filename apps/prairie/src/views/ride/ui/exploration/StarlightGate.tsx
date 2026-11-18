'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, DoubleSide, type ShaderMaterial } from 'three';
import { fragmentShader, vertexShader } from '../../lib/exploration/starlightGate';
import { GATE_RADIUS } from '../../model/exploration/world';

export function StarlightGate({ active, index }: { active: boolean; index: number }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uActive: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime!.value = clock.elapsedTime + index * 1.7;
    material.current.uniforms.uActive!.value = active ? 1 : 0;
  });
  return (
    <group>
      <mesh>
        <torusGeometry args={[GATE_RADIUS, 0.045, 6, 64]} />
        <meshBasicMaterial color={active ? '#fff1c7' : '#b8d7e3'} transparent opacity={active ? 0.95 : 0.35} />
      </mesh>
      <mesh>
        <planeGeometry args={[14, 14]} />
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
