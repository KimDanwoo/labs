import type { WebGLProgramParametersWithUniforms } from 'three';
import { FEATHER_SURFACE as F } from '../../model/runner/constants';

// 깃가지 결이 픽셀보다 촘촘해지면 모아레가 생겨 날개가 망사처럼 비쳐 보인다.
// 화면 미분으로 픽셀당 주기를 재서, 표현할 수 없는 주파수는 bump에서 빼낸다.
const FEATHER_RELIEF = /* glsl */ `
  float shaftX = (vFeatherUv.x - 0.5) * ${F.shaftSharpness.toFixed(1)};
  float shaft = exp(-shaftX * shaftX);
  float phase = vFeatherUv.y * ${F.barbAlong.toFixed(1)} + abs(vFeatherUv.x - 0.5) * ${F.barbAcross.toFixed(1)};
  float barbs = sin(phase);
  float barbVisibility = 1.0 - smoothstep(${F.barbFadeCycles[0]}, ${F.barbFadeCycles[1]}, fwidth(phase) / PI2);
  float shaftVisibility = 1.0 - smoothstep(${F.shaftFadeWidth[0]}, ${F.shaftFadeWidth[1]}, fwidth(shaftX));
  vec2 heightDerivative =
    vec2(dFdx(shaft), dFdy(shaft)) * ${F.shaftHeight} * shaftVisibility +
    vec2(dFdx(barbs), dFdy(barbs)) * ${F.barbHeight} * barbVisibility;
  heightDerivative *= 1.0 - smoothstep(${F.distanceFade[0].toFixed(1)}, ${F.distanceFade[1].toFixed(1)}, length(vViewPosition));
  vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition);
  vec3 crossX = cross(dpdy, normal), crossY = cross(normal, dpdx);
  float surfaceDet = dot(dpdx, crossX) * faceDirection;
  vec3 gradient = heightDerivative.x * crossX + heightDerivative.y * crossY;
  if (abs(surfaceDet) > 1e-8) normal = normalize(abs(surfaceDet) * normal - sign(surfaceDet) * gradient);
`;

export function shadeFeathers(shader: WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vFeatherUv;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFeatherUv = uv;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vFeatherUv;')
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FEATHER_RELIEF}`);
}
