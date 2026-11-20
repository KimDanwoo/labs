import { JOYSTICK } from '@views/ride/model/runner-control/constants';
import { setRunnerAction } from '@views/ride/model/runner-control/store/runnerInput';

export function applyJoystickDirection(dx: number, dy: number): void {
  const { deadzone } = JOYSTICK;
  setRunnerAction('forward', dy < -deadzone); // 화면 위로 = 가속
  setRunnerAction('backward', dy > deadzone);
  setRunnerAction('left', dx < -deadzone);
  setRunnerAction('right', dx > deadzone);
}
