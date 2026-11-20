import { HEAD_CROWN } from '@views/ride/config/headCrown';
import { mirrored } from '@views/ride/lib/runner/headCrownGeometry';
import { RUNNER_FINISH } from '@views/ride/model/runner/constants';

interface RunnerEyeProps {
  side: number;
}

export function RunnerEye({ side }: RunnerEyeProps) {
  const { iris, pupil, glint } = HEAD_CROWN.eye;
  return (
    <group>
      <mesh position={mirrored(iris.offset, side)} scale={iris.scale}>
        <sphereGeometry args={iris.segments} />
        <meshPhysicalMaterial color={RUNNER_FINISH.iris} {...iris.material} />
      </mesh>
      <mesh position={mirrored(pupil.offset, side)} scale={pupil.scale}>
        <sphereGeometry args={pupil.segments} />
        <meshPhysicalMaterial color={RUNNER_FINISH.pupil} {...pupil.material} />
      </mesh>
      <mesh position={mirrored(glint.offset, side)} scale={glint.scale}>
        <sphereGeometry args={glint.segments} />
        <meshBasicMaterial color={RUNNER_FINISH.paleGold} />
      </mesh>
    </group>
  );
}
