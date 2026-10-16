'use client';

import { useFrame } from '@react-three/fiber';
import { runnerState } from '@shared/r3f';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
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
      lengths: number[] = [],
      strands: number[] = [],
      indices: number[] = [];
    for (let strand = 0; strand < 28; strand += 1) {
      const offset = p.length / 3;
      for (let ring = 0; ring <= 12; ring += 1) {
        const t = ring / 12;
        const radius = 0.035 * (1 - t * 0.93);
        for (let side = 0; side < 6; side += 1) {
          const angle = (side / 6) * Math.PI * 2;
          p.push(
            Math.cos(angle) * radius + (strand / 27 - 0.5) * 0.44,
            t,
            Math.sin(angle) * radius + Math.cos(strand * 2.4) * 0.08,
          );
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
      uniform float uTime, uFlow, uTail;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
      vec3 axis = normalize(uBottom - uTop);
      vec3 across = normalize(cross(vec3(1.0, 0.0, 0.0), axis));
      float t = aLength;
      if (uTail > 0.5) {
        transformed = mix(uTop, uBottom, t) + vec3(position.x * (1.0 + t), 0.0, 0.0) + across * position.z;
        transformed.z -= t * t * (0.4 + uFlow * 0.55);
      } else {
        float rootT = aStrand / 27.0;
        vec3 hairRoot = mix(uTop, uBottom, rootT);
        float radialX = position.x - (rootT - 0.5) * 0.44;
        vec3 fall = vec3(0.45 + rootT * 0.25, -0.65 - sin(rootT * 3.14159) * 0.3, -0.18 - uFlow * 0.4);
        transformed = hairRoot + fall * t + vec3(radialX, 0.0, 0.0) + across * position.z;
        transformed.x += sin(t * 3.14159) * 0.12;
      }
      transformed.x += sin(uTime * 2.8 - t * 5.0 + aStrand * 0.3) * (0.035 + uFlow * 0.08) * t * t;
      transformed.y += sin(aStrand * 1.7) * 0.14 * t * t;
      transformed.y += sin(uTime * 2.0 + aStrand * 0.25) * 0.035 * t;`,
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
      <meshStandardMaterial color="#9ba9c5" roughness={0.43} metalness={0.12} onBeforeCompile={shade} />
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
