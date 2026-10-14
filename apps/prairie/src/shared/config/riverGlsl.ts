import { RIVER, RIVER_TRENCH_HALF_WIDTH, TERRAIN } from './scene';

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

  float riverDist(float worldX) {
    float halfPeriod = RIVER_PERIOD * 0.5;
    return abs(mod(worldX - RIVER_FIRST_X + halfPeriod, RIVER_PERIOD) - halfPeriod);
  }

  float riverBedDepth(float dist) {
    return RIVER_DEPTH * (1.0 - smoothstep(RIVER_SLOPE_START, RIVER_TRENCH_HALF, dist));
  }
`;

// RIVER_GLSL(riverDist, RIVER_TRENCH_HALF) 뒤에 넣는다.
export const TERRAIN_GLSL = `
  float terrainHeight(vec2 p) {
    float mask = smoothstep(RIVER_TRENCH_HALF + ${glslFloat(TERRAIN.maskNear)}, RIVER_TRENCH_HALF + ${glslFloat(TERRAIN.maskFar)}, riverDist(p.x));
    float h = ${TERRAIN.waves
      .map(
        (w) => `${glslFloat(w.amp)} * sin(p.x * ${glslFloat(w.kx)} + p.y * ${glslFloat(w.kz)} + ${glslFloat(w.phase)})`,
      )
      .join('\n      + ')};
    return mask * h;
  }
`;
