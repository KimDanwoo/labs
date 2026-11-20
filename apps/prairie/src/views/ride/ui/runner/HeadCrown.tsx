import { HEAD_CROWN } from '@views/ride/config/headCrown';
import { RUNNER_FINISH } from '@views/ride/model/runner/constants';
import { useHeadCrownGeometry } from '@views/ride/model/runner/useHeadCrownGeometry';
import { CrownGem } from '@views/ride/ui/runner/crown/CrownGem';
import { CrownLocks } from '@views/ride/ui/runner/crown/CrownLocks';
import { RunnerEye } from '@views/ride/ui/runner/crown/RunnerEye';

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
