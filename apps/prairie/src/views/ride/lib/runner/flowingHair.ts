import { Vector3 } from 'three';
import { RUNNER_FINISH } from '../../model/runner/constants';

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
