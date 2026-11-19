import { HEAD_CROWN } from '../../config/headCrown';
import { RUNNER_FINISH } from '../../model/runner/constants';
import { useHeadCrownGeometry } from '../../model/runner/useHeadCrownGeometry';
import { CrownGem } from './crown/CrownGem';
import { CrownLocks } from './crown/CrownLocks';
import { RunnerEye } from './crown/RunnerEye';

export function HeadCrown() {
  const { brow, locks } = useHeadCrownGeometry();
  return (
    <group scale={HEAD_CROWN.scale}>
      <mesh geometry={brow}>
        <meshStandardMaterial color={RUNNER_FINISH.gold} {...HEAD_CROWN.brow.material} />
      </mesh>
      <CrownGem />
      <CrownLocks locks={locks} />
      {HEAD_CROWN.eyeSides.map((side) => (
        <RunnerEye key={side} side={side} />
      ))}
    </group>
  );
}
