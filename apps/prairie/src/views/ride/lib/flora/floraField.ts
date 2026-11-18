import { Color, Object3D, Vector3, type WebGLProgramParametersWithUniforms } from 'three';
import { FLORA } from '../../model/flora/constants';

export const dummy = new Object3D();

export const tint = new Color();

export const up = new Vector3(0, 1, 0);

export const branchDirection = new Vector3();

export const CANOPY_COLORS = FLORA.colors.canopy.map((hex) => new Color(hex));

export const CONIFER_COLORS = FLORA.colors.conifer.map((hex) => new Color(hex));

export const timeUniform = { value: 0 };

export function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// 캐노피 잎 머티리얼: 세로 명암(밑은 그늘, 위는 햇빛) + 인스턴스 위치로 위상을 흩은 바람 흔들림.
// 오브젝트 좌표 y를 쓰므로 덩어리·원뿔 모두 "아래 어둡고 위 밝은" 결과가 된다.
function makeFoliageShader(halfHeight: number) {
  return (shader: WebGLProgramParametersWithUniforms): void => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uTime;\nvarying float vFoliageT;\nvarying vec3 vLeafPosition;',
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLeafPosition = position;
        vFoliageT = clamp(position.y / ${halfHeight.toFixed(3)} * 0.5 + 0.5, 0.0, 1.0);
        vec2 anchor = instanceMatrix[3].xz;
        float sway = sin(uTime * 0.9 + anchor.x * 0.37 + anchor.y * 0.29) * ${FLORA.sway.toFixed(3)} * vFoliageT;
        transformed.x += sway;
        transformed.z += sway * 0.6;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFoliageT;\nvarying vec3 vLeafPosition;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float dapple = sin(vLeafPosition.x * 17.0 + sin(vLeafPosition.z * 13.0)) * sin(vLeafPosition.y * 19.0 + sin(vLeafPosition.x * 15.0));
        diffuseColor.rgb *= (0.94 + dapple * 0.06) * mix(${FLORA.shadeBottom.toFixed(2)}, ${FLORA.shadeTop.toFixed(2)}, vFoliageT);`,
      );
  };
}

export const shadeCanopy = makeFoliageShader(FLORA.canopy.radius);

export const shadeConifer = makeFoliageShader(FLORA.conifer.tierHeight / 2);
