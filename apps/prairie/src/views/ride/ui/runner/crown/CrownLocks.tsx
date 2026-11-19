import type { TubeGeometry } from 'three';
import { HEAD_CROWN } from '../../../config/headCrown';
import { RUNNER_FINISH } from '../../../model/runner/constants';

interface CrownLocksProps {
  locks: TubeGeometry[];
}

export function CrownLocks({ locks }: CrownLocksProps) {
  return locks.map((geometry, index) => (
    <mesh key={index} geometry={geometry}>
      <meshPhysicalMaterial
        color={index % 2 ? RUNNER_FINISH.maneTip : RUNNER_FINISH.maneRoot}
        {...HEAD_CROWN.locks.material}
        sheenColor={RUNNER_FINISH.paleGold}
      />
    </mesh>
  ));
}
