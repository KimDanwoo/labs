'use client';

import { useRunnerRig } from '../../model/runner-control/hooks/useRunnerRig';
import { SPIN_SKILL } from '../../model/runner-control/services/spinSkill';
import { GroundShadow } from '../runner/GroundShadow';
import { Runner } from '../runner/Runner';
import { SpinStardust } from '../runner/SpinStardust';
import { SprintTrail } from '../runner/SprintTrail';
import { WadeSplash } from '../runner/WadeSplash';

export function RunnerRig() {
  const { rootRef, rollRef, speedRef } = useRunnerRig();

  return (
    <>
      <group ref={rootRef}>
        <group ref={rollRef} position={[0, SPIN_SKILL.pivotHeight, 0]}>
          <group position={[0, -SPIN_SKILL.pivotHeight, 0]}>
            <Runner speedRef={speedRef} />
          </group>
        </group>
      </group>
      <GroundShadow />
      <WadeSplash />
      <SprintTrail />
      <SpinStardust />
    </>
  );
}
