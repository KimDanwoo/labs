'use client';

import { GROUND_SHADOW } from '@entities/runner/model/constants';
import { useFrame } from '@react-three/fiber';
import { terrainHeightAt } from '@shared/config';
import { runnerState } from '@shared/r3f';
import { useRef } from 'react';
import { Matrix4, Mesh, ShaderMaterial, Vector3 } from 'three';

const SLOPE_SAMPLE = 0.5;
const normal = new Vector3();
const along = new Vector3();
const across = new Vector3();
const basis = new Matrix4();

// 말 발밑 접지 그림자. 실제 그림자 맵 없이 타원 그라데이션 한 장 — 말이 땅에 붙어 보이게 하는 가장 싼 단서.
// 공중에선 옅어지고 조금 퍼진다(높이감).
const shadowMaterial = new ShaderMaterial({
  uniforms: { uOpacity: { value: GROUND_SHADOW.opacity } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float d = length((vUv - 0.5) * 2.0);
      float alpha = (1.0 - smoothstep(${GROUND_SHADOW.core.toFixed(2)}, 1.0, d)) * uOpacity;
      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
});

export function GroundShadow() {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { position, heading, airborneHeight } = runnerState;
    const lift = Math.min(airborneHeight / GROUND_SHADOW.fadeHeight, 1);
    mesh.position.set(position.x, position.y - airborneHeight + GROUND_SHADOW.hover, position.z);
    // 지형 경사를 따라 눕힌다: 수치 기울기로 법선을 만들고, 진행 방향을 접평면에 투영해 긴 축(로컬 y)으로, 법선을 로컬 z로 둔다.
    // lookAt은 법선이 수직일 때와 아닐 때 기준축이 달라져 회전이 어긋난다 → 기저를 직접 만든다.
    const dhdx =
      (terrainHeightAt(position.x + SLOPE_SAMPLE, position.z) -
        terrainHeightAt(position.x - SLOPE_SAMPLE, position.z)) /
      (2 * SLOPE_SAMPLE);
    const dhdz =
      (terrainHeightAt(position.x, position.z + SLOPE_SAMPLE) -
        terrainHeightAt(position.x, position.z - SLOPE_SAMPLE)) /
      (2 * SLOPE_SAMPLE);
    normal.set(-dhdx, 1, -dhdz).normalize();
    along.set(Math.sin(heading), 0, Math.cos(heading));
    along.addScaledVector(normal, -along.dot(normal)).normalize();
    across.crossVectors(along, normal);
    mesh.quaternion.setFromRotationMatrix(basis.makeBasis(across, along, normal));
    const spread = 1 + lift * GROUND_SHADOW.airSpread;
    mesh.scale.set(spread, spread, 1);
    shadowMaterial.uniforms.uOpacity!.value = GROUND_SHADOW.opacity * (1 - lift);
  });

  return (
    <mesh ref={meshRef} material={shadowMaterial} renderOrder={GROUND_SHADOW.renderOrder}>
      <planeGeometry args={[GROUND_SHADOW.width, GROUND_SHADOW.length]} />
    </mesh>
  );
}
