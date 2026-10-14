'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { HAZE, RIDGES, SCENE_COLORS } from '@shared/config';
import { useRef } from 'react';
import { BackSide, Color, Mesh, ShaderMaterial } from 'three';

const HEIGHT = HAZE.topY - HAZE.bottomY;
const CENTER_Y = (HAZE.topY + HAZE.bottomY) / 2;

const glslFloat = (value: number): string => value.toFixed(4);
// hex → 선형 RGB(three Color가 sRGB를 풀어준다). 출력은 아래 tonemapping/colorspace include가 다른 머티리얼과 같은 경로로 인코딩한다.
const glslColor = (hex: string): string => {
  const { r, g, b } = new Color(hex);
  return `vec3(${glslFloat(r)}, ${glslFloat(g)}, ${glslFloat(b)})`;
};

// 능선 하나: 둘레 좌표 u(0..1)에서의 높이(월드 m). 겹마다 상수로 굽는다 → 유니폼 없음.
// 가까운 겹일수록 나중에 덮어쓰고, 각 겹은 밑동이 안개색으로 녹아 지면 안개 띠와 선 없이 이어진다.
const RIDGE_GLSL = RIDGES.map(
  (ridge) => `
    {
      float u = vUv.x + ${glslFloat(ridge.seed)};
      float h = ${glslFloat(ridge.baseY)} + ${glslFloat(ridge.ampY)} * ridgeNoise(u, ${glslFloat(ridge.cells)});
      float cover = 1.0 - smoothstep(h - EDGE, h + EDGE, y);
      // 해 쪽(+u) 사면은 밝게, 반대 사면은 어둡게 — 기울기 부호로 간단히.
      float slope = ridgeNoise(u + SLOPE_DU, ${glslFloat(ridge.cells)}) - ridgeNoise(u - SLOPE_DU, ${glslFloat(ridge.cells)});
      float lit = 1.0 + SLOPE_SHADE * clamp(slope * ${glslFloat(ridge.ampY)} / SLOPE_SCALE, -1.0, 1.0);
      vec3 tint = ${glslColor(ridge.color)} * lit;
      // 대기 원근: 밑동(능선 높이의 35%까지)은 안개가 절반쯤 덮는다. 겹 사이 거리감은 겹 색 자체가 낸다.
      vec3 ridgeColor = mix(tint, uFog, BASE_FOG * (1.0 - smoothstep(0.0, 0.35 * h, y)));
      color = mix(color, ridgeColor, cover);
      alpha = max(alpha, cover);
    }`,
).join('\n');

// 씬에 하나라 모듈 싱글턴.
const hazeMaterial = new ShaderMaterial({
  uniforms: {
    uFog: { value: new Color(SCENE_COLORS.fog) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uFog;
    varying vec2 vUv;

    const float BOTTOM_Y = ${glslFloat(HAZE.bottomY)};
    const float HEIGHT = ${glslFloat(HEIGHT)};
    const float FADE_START_Y = ${glslFloat(HAZE.fadeStartY)};
    const float FADE_TOP_Y = ${glslFloat(HAZE.fadeTopY)};
    // 능선 가장자리 안티에일리어싱 폭(m). 반경 1000에서 화면 1px ≈ 1m.
    const float EDGE = 1.6;
    // 사면 음영: 둘레 좌표 차분 폭과 음영 세기.
    const float SLOPE_DU = 0.004;
    const float SLOPE_SCALE = 12.0;
    const float SLOPE_SHADE = 0.1;
    const float BASE_FOG = 0.5;

    float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

    // 둘레에 주기적인 1D 값 노이즈. cells가 정수라 u=0/1에서 이어진다.
    float periodicNoise(float u, float cells) {
      float x = u * cells;
      float i = floor(x);
      float f = x - i;
      f = f * f * (3.0 - 2.0 * f);
      return mix(hash(mod(i, cells)), hash(mod(i + 1.0, cells)), f);
    }

    // 4옥타브 fbm을 능선형(봉우리가 뾰족하게)으로. 0..1.
    float ridgeNoise(float u, float cells) {
      float sum = 0.0;
      float amp = 1.0;
      float norm = 0.0;
      float c = cells;
      for (int i = 0; i < 4; i++) {
        float n = 1.0 - abs(2.0 * periodicNoise(u, c) - 1.0);
        sum += n * amp;
        norm += amp;
        amp *= 0.5;
        c *= 2.0;
      }
      float h = sum / norm;
      return h * h * (3.0 - 2.0 * h) * h;
    }

    void main() {
      float y = BOTTOM_Y + vUv.y * HEIGHT;
      vec3 color = uFog;
      float alpha = 1.0 - smoothstep(FADE_START_Y, FADE_TOP_Y, y);
      ${RIDGE_GLSL}
      gl_FragColor = vec4(color, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
  side: BackSide,
  transparent: true,
  depthWrite: false,
});

// 지평선 헤이즈 + 먼 능선 원통. 카메라 XZ를 따라다녀 항상 시야 끝을 감싼다.
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
      <cylinderGeometry args={[HAZE.radius, HAZE.radius, HEIGHT, 96, 1, true]} />
    </mesh>
  );
}
