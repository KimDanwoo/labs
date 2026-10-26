'use client';

import { useFrame } from '@react-three/fiber';
import { runnerState } from '@shared/r3f';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  Vector3,
  type Object3D,
  type WebGLProgramParametersWithUniforms,
} from 'three';

type FlowingHairProps = { head: Object3D; neck: Object3D; speedRef: { current: number }; isTail?: boolean };

export function FlowingHair({ head, neck, speedRef, isTail = false }: FlowingHairProps) {
  const mesh = useRef<Mesh>(null);
  const active = useRef<ReturnType<typeof makeUniforms> | null>(null);
  const uniforms = useMemo(() => makeUniforms(), []);
  useEffect(() => {
    active.current = uniforms;
  }, [uniforms]);
  const geometry = useMemo(() => {
    const p: number[] = [],
      colors: number[] = [],
      lengths: number[] = [],
      strands: number[] = [],
      indices: number[] = [];
    for (let strand = 0; strand < 28; strand += 1) {
      const offset = p.length / 3;
      for (let ring = 0; ring <= 12; ring += 1) {
        const t = ring / 12;
        const radius = 0.043 * Math.pow(1 - t * 0.97, 0.8);
        for (let side = 0; side < 6; side += 1) {
          const angle = (side / 6) * Math.PI * 2;
          p.push(Math.cos(angle) * radius, t, Math.sin(angle) * radius);
          const color = new Color('#425f88').lerp(new Color('#f5dfad'), 0.3 + t * 0.5 + Math.sin(strand * 2.4) * 0.12);
          colors.push(color.r, color.g, color.b);
          lengths.push(t);
          strands.push(strand);
        }
      }
      for (let ring = 0; ring < 12; ring += 1) {
        for (let side = 0; side < 6; side += 1) {
          const a = offset + ring * 6 + side,
            b = offset + ring * 6 + ((side + 1) % 6);
          indices.push(a, a + 6, b, b, a + 6, b + 6);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(p, 3));
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    g.setAttribute('aLength', new Float32BufferAttribute(lengths, 1));
    g.setAttribute('aStrand', new Float32BufferAttribute(strands, 1));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  const shade = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
      attribute float aLength, aStrand;
      uniform vec3 uTop, uBottom;
      uniform float uTime, uFlow, uTail;
      vec3 hairCenter(float t, float strand) {
        float rootT = strand / 27.0;
        float phase = strand * 2.39996;
        vec3 center;
        if (uTail > 0.5) {
          float spread = sqrt((strand + 0.5) / 28.0);
          center = mix(uTop, uBottom, t);
          center.x += cos(phase) * spread * (0.08 + sin(t * 2.4) * 0.22);
          center.z += sin(phase) * spread * 0.1;
          center.z -= t * t * (0.35 + uFlow * 0.5);
          center.y -= t * t * (0.12 + 0.16 * sin(phase));
        } else {
          center = mix(uTop, uBottom, rootT);
          float length = 0.92 + sin(rootT * 3.14159) * 0.36;
          center += vec3(0.32 + rootT * 0.18, -length, -0.14 - uFlow * 0.38) * t;
          center.x += sin(t * 3.14159) * 0.2;
          center.y += sin(phase) * 0.08 * t * t;
        }
        center.x += sin(uTime * 2.8 - t * 5.0 + strand * 0.3) * (0.025 + uFlow * 0.07) * t * t;
        center.y += sin(uTime * 2.0 + strand * 0.25) * 0.025 * t;
        return center;
      }
      mat3 hairFrame(float t, float strand) {
        vec3 tangent = normalize(hairCenter(t + 0.002, strand) - hairCenter(t - 0.002, strand));
        vec3 across = normalize(cross(vec3(1.0, 0.0, 0.0), tangent));
        return mat3(normalize(cross(tangent, across)), tangent, across);
      }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        objectNormal = hairFrame(aLength, aStrand) * objectNormal;`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = hairCenter(aLength, aStrand)
          + hairFrame(aLength, aStrand) * vec3(position.x, 0.0, position.z);`,
      );
  };
  useFrame(({ clock }) => {
    const u = active.current,
      object = mesh.current;
    if (!u || !object?.parent) return;
    head.getWorldPosition(u.uTop.value);
    neck.getWorldPosition(u.uBottom.value);
    object.parent.worldToLocal(u.uTop.value);
    object.parent.worldToLocal(u.uBottom.value);
    u.uTail.value = isTail ? 1 : 0;
    u.uTop.value.y += isTail ? 0 : 0.35;
    u.uTop.value.z -= isTail ? 0 : 0.22;
    u.uBottom.value.y += isTail ? -0.25 : 0.3;
    u.uBottom.value.z -= isTail ? 0 : 0.3;
    u.uTime.value = clock.elapsedTime;
    u.uFlow.value = Math.min(Math.abs(speedRef.current) / 10 + runnerState.airborneHeight * 0.05, 1.4);
  });
  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
      <meshPhysicalMaterial
        vertexColors
        roughness={0.48}
        metalness={0.04}
        sheen={0.65}
        sheenColor="#f7eee1"
        sheenRoughness={0.5}
        onBeforeCompile={shade}
      />
    </mesh>
  );
}

function makeUniforms() {
  return {
    uTop: { value: new Vector3() },
    uBottom: { value: new Vector3() },
    uTime: { value: 0 },
    uFlow: { value: 0 },
    uTail: { value: 0 },
  };
}
