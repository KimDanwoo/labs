'use client';

import { useFrame } from '@react-three/fiber';
import { GATE_RADIUS } from '@shared/exploration/world';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, DoubleSide, type ShaderMaterial } from 'three';

const vertexShader = `
  varying vec2 vGateUv;
  void main() {
    vGateUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A transparent annulus leaves the flight aperture clear. Four-point stars and
// drifting arc fragments share one plane, without bloom passes or point lights.
const fragmentShader = `
  uniform float uTime;
  uniform float uActive;
  varying vec2 vGateUv;
  #define TAU 6.28318530718
  void main() {
    vec2 p = (vGateUv - 0.5) * 14.0;
    float r = length(p);
    float angle = atan(p.y, p.x);
    float pulse = 0.88 + 0.12 * sin(uTime * 2.1);
    float rim = exp(-pow((r - 4.5) / 0.065, 2.0));
    float halo = exp(-pow((r - 4.5) / 0.36, 2.0)) * 0.33;
    float arcA = pow(max(0.0, sin(angle * 3.0 - uTime * 0.75)), 7.0);
    float arcB = pow(max(0.0, sin(angle * 5.0 + uTime * 0.5)), 10.0);
    float filigree = exp(-pow((r - 4.95) / 0.045, 2.0)) * arcA;
    filigree += exp(-pow((r - 4.13) / 0.035, 2.0)) * arcB * 0.6;
    float stars = 0.0;
    for (int i = 0; i < 22; i++) {
      float seed = float(i);
      float a = seed * 2.399963 + uTime * (0.08 + mod(seed, 3.0) * 0.025);
      float orbit = 4.65 + sin(seed * 7.13 + uTime * 0.6) * 0.65;
      vec2 d = p - vec2(cos(a), sin(a)) * orbit;
      float twinkle = pow(0.5 + 0.5 * sin(uTime * (1.4 + mod(seed, 4.0) * 0.3) + seed * 3.7), 3.0);
      float size = 0.12 + twinkle * 0.19;
      float crossLight = exp(-abs(d.x) / 0.022 - abs(d.y) / size);
      crossLight += exp(-abs(d.y) / 0.022 - abs(d.x) / size);
      stars += crossLight * (0.25 + twinkle);
    }
    vec3 gold = vec3(1.0, 0.72, 0.30);
    vec3 pearl = vec3(0.65, 0.88, 1.0);
    vec3 tint = mix(gold, pearl, 0.5 + 0.5 * sin(angle * 2.0 + uTime * 0.3));
    float strength = (rim + halo + filigree * 0.8) * pulse + stars;
    float gateBrightness = mix(0.32, 1.0, uActive);
    gl_FragColor = vec4(mix(tint, vec3(1.0), clamp(stars, 0.0, 0.8)), clamp(strength * gateBrightness, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

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
