'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { RIVER_GLSL, SCENE_COLORS, WORLD } from '@shared/config';
import { useRef } from 'react';
import { Mesh, type WebGLProgramParametersWithUniforms } from 'three';

// 2D 값 노이즈(해시 + 부드러운 보간). 0..1.
const GROUND_NOISE_GLSL = `
  float groundHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float groundNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = p - i;
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(groundHash(i), groundHash(i + vec2(1.0, 0.0)), f.x),
      mix(groundHash(i + vec2(0.0, 1.0)), groundHash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
`;

// 강 골 자리의 바닥 픽셀을 버린다 → 그 아래 파인 하상이 보인다. 강 위치는 순수 수식이라 유니폼 갱신이 없다.
// 지면은 unlit이라 색이 SCENE_COLORS.grass 그대로 → 잔디 blade가 멀어지며 정확히 이 색에 녹는다.
// 그 위에 잔디 인상: 가늘고 긴 셀(멀리서 본 풀 다발) + 저주파 얼룩 + 미세 반점. 무늬는 안개 범위에 맞춰 멀어지면 흐려진다(에일리어싱 방지).
function shadeGround(shader: WebGLProgramParametersWithUniforms): void {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vGroundWorldXZ;')
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvGroundWorldXZ = (modelMatrix * vec4(transformed, 1.0)).xz;',
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>\nvarying vec2 vGroundWorldXZ;\n${RIVER_GLSL}\n${GROUND_NOISE_GLSL}`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif (riverDist(vGroundWorldXZ.x) < RIVER_TRENCH_HALF) discard;',
    )
    .replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // fogNear/fogFar는 three의 선형 Fog 청크가 선언하는 유니폼 — 씬을 FogExp2로 바꾸면 여기가 컴파일에 실패한다.
      float blur = smoothstep(fogNear * 0.8, fogFar * 0.9, vFogDepth);
      float meadow = sin(vGroundWorldXZ.x * 0.13) * sin(vGroundWorldXZ.y * 0.17) * 0.5 + 0.5;
      // 풀 다발 인상: z로 길쭉한 값 노이즈(가는 줄기 결) × 넓은 얼룩. 부드러운 보간이라 공중에서 내려다봐도 격자가 안 보인다.
      float streak = groundNoise(vGroundWorldXZ * vec2(3.0, 0.9));
      float blotch = groundNoise(vGroundWorldXZ * 0.45 + 17.0);
      float detail = mix(0.86, 1.14, streak) * mix(0.94, 1.06, blotch);
      diffuseColor.rgb *= mix(0.86, 1.0, meadow) * mix(detail, 1.0, blur);`,
    );
}

// 바닥 평면이 카메라 XZ를 따라다녀 가장자리에 닿지 않는다 → 무한 들판.
export function Ground() {
  const meshRef = useRef<Mesh>(null);
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.x = camera.position.x;
    mesh.position.z = camera.position.z;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[WORLD.groundSize, WORLD.groundSize, WORLD.groundSegments, WORLD.groundSegments]} />
      <meshBasicMaterial color={SCENE_COLORS.grass} onBeforeCompile={shadeGround} />
    </mesh>
  );
}
