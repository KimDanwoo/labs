import { GROUND_SHADOW } from '@views/ride/model/runner/constants';
import { Matrix4, ShaderMaterial, Vector3 } from 'three';

export const SLOPE_SAMPLE = 0.5;

export const normal = new Vector3();

export const along = new Vector3();

export const across = new Vector3();

export const basis = new Matrix4();

// 말 발밑 접지 그림자. 실제 그림자 맵 없이 타원 그라데이션 한 장 — 말이 땅에 붙어 보이게 하는 가장 싼 단서.
// 공중에선 옅어지고 조금 퍼진다(높이감).
export const shadowMaterial = new ShaderMaterial({
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
