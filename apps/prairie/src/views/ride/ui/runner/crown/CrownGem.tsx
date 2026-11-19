import { HEAD_CROWN } from '../../../config/headCrown';
import { RUNNER_FINISH } from '../../../model/runner/constants';

export function CrownGem() {
  const { position, scale, detail, material } = HEAD_CROWN.gem;
  return (
    <mesh position={position} scale={scale}>
      <octahedronGeometry args={detail} />
      <meshPhysicalMaterial color={RUNNER_FINISH.opal} {...material} />
    </mesh>
  );
}
