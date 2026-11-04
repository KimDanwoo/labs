import type { WebGLProgramParametersWithUniforms } from 'three';

export function shadeFeathers(shader: WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vFeatherUv;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFeatherUv = uv;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vFeatherUv;')
    .replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      float shaft = exp(-pow((vFeatherUv.x - 0.5) * 35.0, 2.0));
      float barbs = sin(vFeatherUv.y * 280.0 + abs(vFeatherUv.x - 0.5) * 100.0);
      float relief = (shaft * 0.003 + barbs * 0.00035) * (1.0 - smoothstep(8.0, 24.0, length(vViewPosition)));
      vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition);
      vec3 crossX = cross(dpdy, normal), crossY = cross(normal, dpdx);
      float surfaceDet = dot(dpdx, crossX);
      vec3 gradient = dFdx(relief) * crossX + dFdy(relief) * crossY;
      if (abs(surfaceDet) > 0.00000001) normal = normalize(abs(surfaceDet) * normal - sign(surfaceDet) * gradient);
    `,
    );
}
