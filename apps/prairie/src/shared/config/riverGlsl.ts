import { OCEAN, RIVER, RIVER_TRENCH_HALF_WIDTH, TERRAIN } from './scene';

const glslFloat = (value: number): string => value.toFixed(4);

// 강 기하를 GLSL로. 유니폼 없이 상수로 굽는다 → Ground의 구멍, 하상 변위, 수심 계산이 같은 식을 공유한다.
// JS의 nearestRiverX / riverBedDepthAt과 동일해야 한다(테스트가 JS 쪽을 고정).
export const RIVER_GLSL = `
  const float RIVER_FIRST_X = ${glslFloat(RIVER.firstX)};
  const float RIVER_PERIOD = ${glslFloat(RIVER.period)};
  const float RIVER_TRENCH_HALF = ${glslFloat(RIVER_TRENCH_HALF_WIDTH)};
  const float RIVER_DEPTH = ${glslFloat(RIVER.depth)};
  const float RIVER_SLOPE_START = ${glslFloat(RIVER.slopeStart)};
  const float RIVER_WATER_DROP = ${glslFloat(RIVER.waterDrop)};

  float riverOffset(float z) {
    return ${RIVER.bends.map((w) => `${glslFloat(w.amplitude)} * sin(z * ${glslFloat(w.frequency)})`).join(' + ')};
  }

  float riverWidth(float z) {
    return (1.0 + ${RIVER.widthWaves.map((w) => `${glslFloat(w.amplitude)} * sin(z * ${glslFloat(w.frequency)})`).join(' + ')}) * (1.0 + ${glslFloat(OCEAN.estuaryExpansion)} * smoothstep(${glslFloat(OCEAN.estuaryStart)}, ${glslFloat(OCEAN.estuaryEnd)}, z));
  }

  float riverDist(vec2 p) {
    float halfPeriod = RIVER_PERIOD * 0.5;
    return abs(mod(p.x - RIVER_FIRST_X - riverOffset(p.y) + halfPeriod, RIVER_PERIOD) - halfPeriod) / riverWidth(p.y);
  }

  float riverBedDepth(float dist) {
    return RIVER_DEPTH * (1.0 - smoothstep(RIVER_SLOPE_START, RIVER_TRENCH_HALF, dist));
  }
  float coastDistance(vec2 p) {
    return p.y - (${glslFloat(OCEAN.coastZ)} + 18.0 * sin(p.x * 0.004) + 9.0 * sin(p.x * 0.011));
  }
  float coastBedDepth(vec2 p) {
    float d = coastDistance(p);
    return RIVER_WATER_DROP * smoothstep(-${glslFloat(OCEAN.beachWidth)}, 0.0, d)
      + ${glslFloat(OCEAN.depth)} * smoothstep(0.0, ${glslFloat(OCEAN.shelfLength)}, d);
  }
  float waterBedDepth(vec2 p) {
    return max(riverBedDepth(riverDist(p)), coastBedDepth(p));
  }
`;

// RIVER_GLSL(riverDist, RIVER_TRENCH_HALF) 뒤에 넣는다.
export const TERRAIN_GLSL = `
  float terrainHeight(vec2 p) {
    float mask = smoothstep(RIVER_TRENCH_HALF + ${glslFloat(TERRAIN.maskNear)}, RIVER_TRENCH_HALF + ${glslFloat(TERRAIN.maskFar)}, riverDist(p));
    float h = ${TERRAIN.waves
      .map(
        (w) => `${glslFloat(w.amp)} * sin(p.x * ${glslFloat(w.kx)} + p.y * ${glslFloat(w.kz)} + ${glslFloat(w.phase)})`,
      )
      .join('\n      + ')};
    return mask * h * (1.0 - smoothstep(-${glslFloat(OCEAN.beachWidth + 70)}, -${glslFloat(OCEAN.beachWidth)}, coastDistance(p)));
  }
`;
