'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { HAZE, SCENE_COLORS } from '@shared/config';
import { useRef } from 'react';
import { BackSide, Color, Mesh, ShaderMaterial } from 'three';

const HEIGHT = HAZE.fadeTopY - HAZE.bottomY;
const CENTER_Y = (HAZE.fadeTopY + HAZE.bottomY) / 2;
const FADE_START_T = (HAZE.fadeStartY - HAZE.bottomY) / HEIGHT;

// 아래(uv.y=0)는 안개색 불투명, fadeStart부터 위 끝까지 투명으로. 씬에 하나라 모듈 싱글턴.
const hazeMaterial = new ShaderMaterial({
  uniforms: {
    uColor: { value: new Color(SCENE_COLORS.fog) },
    uFadeStart: { value: FADE_START_T },
  },
  vertexShader: `
    varying float vT;
    void main() {
      vT = uv.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uFadeStart;
    varying float vT;
    void main() {
      float alpha = 1.0 - smoothstep(uFadeStart, 1.0, vT);
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  side: BackSide,
  transparent: true,
  depthWrite: false,
});

// 지평선 헤이즈 원통. 카메라 XZ를 따라다녀 항상 시야 끝을 감싼다.
export function Haze() {
  const meshRef = useRef<Mesh>(null);
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.x = camera.position.x;
    mesh.position.z = camera.position.z;
  });

  return (
    <mesh ref={meshRef} position={[0, CENTER_Y, 0]} material={hazeMaterial}>
      <cylinderGeometry args={[HAZE.radius, HAZE.radius, HEIGHT, 48, 1, true]} />
    </mesh>
  );
}
