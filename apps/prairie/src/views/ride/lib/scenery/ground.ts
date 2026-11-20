import { MEADOW_LIGHT_GLSL } from '@views/ride/config/meadowGlsl';
import { RIVER_GLSL, TERRAIN_GLSL } from '@views/ride/config/riverGlsl';
import { MEADOW_PATH, SCENE_COLORS, WORLD } from '@views/ride/config/scene';
import { Color, type WebGLProgramParametersWithUniforms } from 'three';

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

export const groundTime = { value: 0 };

export function shadeGround(shader: WebGLProgramParametersWithUniforms): void {
  shader.uniforms.uMeadowTime = groundTime;
  shader.uniforms.uSandColor = { value: new Color('#c8b68f') };
  shader.uniforms.uWetSandColor = { value: new Color('#8a947b') };
  shader.uniforms.uPathColor = { value: new Color(SCENE_COLORS.path) };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\nvarying vec2 vGroundWorldXZ;\n${RIVER_GLSL}\n${TERRAIN_GLSL}`)
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vGroundWorldXZ = (modelMatrix * vec4(transformed, 1.0)).xz;
      transformed.z += terrainHeight(vGroundWorldXZ) - waterBedDepth(vGroundWorldXZ);`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>\nvarying vec2 vGroundWorldXZ;\nuniform float uMeadowTime;\nuniform vec3 uSandColor, uWetSandColor, uPathColor;\n${RIVER_GLSL}\n${GROUND_NOISE_GLSL}\n${MEADOW_LIGHT_GLSL}`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif (coastDistance(vGroundWorldXZ) < 0.0 && riverDist(vGroundWorldXZ) < RIVER_TRENCH_HALF) discard;',
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
      diffuseColor.rgb *= mix(0.86, 1.0, meadow) * mix(detail, 1.0, blur);
      float pathZ = vGroundWorldXZ.y;
      float pathX = -${MEADOW_PATH.drift.toFixed(1)} * pow(sin(max(0.0, pathZ) / ${MEADOW_PATH.length.toFixed(1)} * 3.14159265), 2.0);
      float pathEdge = abs(vGroundWorldXZ.x - pathX) + (blotch - 0.5) * 1.1;
      float path = 1.0 - smoothstep(${MEADOW_PATH.halfWidth.toFixed(1)}, ${(MEADOW_PATH.halfWidth + MEADOW_PATH.edge).toFixed(1)}, pathEdge);
      path *= smoothstep(-25.0, -8.0, pathZ) * (1.0 - smoothstep(${MEADOW_PATH.length.toFixed(1)}, ${(MEADOW_PATH.length + 25).toFixed(1)}, pathZ));
      diffuseColor.rgb = mix(diffuseColor.rgb, uPathColor * (0.86 + blotch * 0.16), path * 0.75);
      float grit = groundNoise(vGroundWorldXZ * 10.0);
      diffuseColor.rgb *= mix(0.9 + grit * 0.2, 1.0, smoothstep(10.0, 30.0, vFogDepth));
      diffuseColor.rgb *= mix(meadowLight(vGroundWorldXZ, uMeadowTime), 1.0, blur);
      float coast = coastDistance(vGroundWorldXZ);
      float beach = smoothstep(-32.0, -18.0, coast + (blotch - 0.5) * 6.0);
      vec3 sand = mix(uSandColor, uWetSandColor, smoothstep(-10.0, 4.0, coast));
      sand *= 0.96 + 0.06 * blotch;
      diffuseColor.rgb = mix(diffuseColor.rgb, sand, beach);`,
    );
}

export const GRID_STEP = WORLD.groundSize / WORLD.groundSegments;

export const SHADOW_LAYER_LIFT = 0.02;
export const SHADOW_OPACITY = 0.3;
