import { MathUtils } from 'three';

// 공중 이동도 속도에 따라 걷기·갤럽, 호버링은 접은 다리 포즈. 모든 상태에서 합이 1이다.
export function gaitWeights(speed: number, height: number, gallopStart: number, gallopEnd: number) {
  const moving = MathUtils.smoothstep(Math.abs(speed), 0.1, 0.9);
  const gallop = MathUtils.smoothstep(Math.abs(speed), gallopStart, gallopEnd);
  const airborne = MathUtils.smoothstep(height, 0.15, 0.8);
  const airMoving = airborne * MathUtils.smoothstep(Math.abs(speed), 0.3, 1.5);
  return {
    idle: (1 - moving) * (1 - airborne),
    walk: moving * (1 - gallop) * (1 - airborne) + airMoving * (1 - gallop),
    run: moving * gallop * (1 - airborne) + airMoving * gallop,
    flight: airborne - airMoving,
    airborne,
  };
}
