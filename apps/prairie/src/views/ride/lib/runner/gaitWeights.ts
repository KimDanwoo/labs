import { MathUtils } from 'three';

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
