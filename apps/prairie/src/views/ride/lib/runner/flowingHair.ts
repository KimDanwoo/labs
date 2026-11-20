import { FLOWING_HAIR } from '@views/ride/config/flowingHair';
import { HAIR_COMMON_GLSL, HAIR_NORMAL_GLSL, HAIR_VERTEX_GLSL } from '@views/ride/config/flowingHairGlsl';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { RUNNER_FINISH } from '@views/ride/model/runner/constants';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Vector3,
  type Object3D,
  type WebGLProgramParametersWithUniforms,
} from 'three';

export function makeUniforms() {
  return {
    uTop: { value: new Vector3() },
    uBottom: { value: new Vector3() },
    uTime: { value: 0 },
    uFlow: { value: 0 },
    uTail: { value: 0 },
    uStrandCount: { value: RUNNER_FINISH.strands as number },
  };
}

export type HairUniforms = ReturnType<typeof makeUniforms>;

export function makeHairGeometry(strandCount: number): BufferGeometry {
  const { rings, sides, radius, taperPower, taperRatio, tint } = FLOWING_HAIR;
  const p: number[] = [],
    colors: number[] = [],
    lengths: number[] = [],
    strands: number[] = [],
    indices: number[] = [];
  for (let strand = 0; strand < strandCount; strand += 1) {
    const offset = p.length / 3;
    for (let ring = 0; ring <= rings; ring += 1) {
      const t = ring / rings;
      const ringRadius = radius * Math.pow(1 - t * taperRatio, taperPower);
      for (let side = 0; side < sides; side += 1) {
        const angle = (side / sides) * Math.PI * 2;
        p.push(Math.cos(angle) * ringRadius, t, Math.sin(angle) * ringRadius);
        const blend = tint.base + t * tint.along + Math.sin(strand * tint.waveRate) * tint.wave;
        const color = new Color(RUNNER_FINISH.maneRoot).lerp(new Color(RUNNER_FINISH.maneTip), blend);
        colors.push(color.r, color.g, color.b);
        lengths.push(t);
        strands.push(strand);
      }
    }
    for (let ring = 0; ring < rings; ring += 1) {
      for (let side = 0; side < sides; side += 1) {
        const a = offset + ring * sides + side,
          b = offset + ring * sides + ((side + 1) % sides);
        indices.push(a, a + sides, b, b, a + sides, b + sides);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(p, 3));
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.setAttribute('aLength', new Float32BufferAttribute(lengths, 1));
  g.setAttribute('aStrand', new Float32BufferAttribute(strands, 1));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function injectHairShader(shader: WebGLProgramParametersWithUniforms, uniforms: HairUniforms): void {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', HAIR_COMMON_GLSL)
    .replace('#include <beginnormal_vertex>', HAIR_NORMAL_GLSL)
    .replace('#include <begin_vertex>', HAIR_VERTEX_GLSL);
}

export function updateHairUniforms(
  u: HairUniforms,
  parent: Object3D,
  ends: { head: Object3D; neck: Object3D },
  options: { isTail: boolean; strandCount: number; speed: number; elapsed: number },
): void {
  const { isTail, strandCount, speed, elapsed } = options;
  const { topOffset, bottomOffset, flow } = FLOWING_HAIR;
  const top = isTail ? topOffset.tail : topOffset.mane;
  const bottom = isTail ? bottomOffset.tail : bottomOffset.mane;
  ends.head.getWorldPosition(u.uTop.value);
  ends.neck.getWorldPosition(u.uBottom.value);
  parent.worldToLocal(u.uTop.value);
  parent.worldToLocal(u.uBottom.value);
  u.uTail.value = isTail ? 1 : 0;
  u.uStrandCount.value = strandCount;
  u.uTop.value.y += top.y;
  u.uTop.value.z -= top.z;
  u.uBottom.value.y += bottom.y;
  u.uBottom.value.z -= bottom.z;
  u.uTime.value = elapsed;
  u.uFlow.value = Math.min(
    Math.abs(speed) / flow.speedDivisor + runnerState.airborneHeight * flow.airborneGain,
    flow.max,
  );
}
