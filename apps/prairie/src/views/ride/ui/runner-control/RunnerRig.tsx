'use client';

import { useRunnerRig } from '@views/ride/model/runner-control/hooks/useRunnerRig';
import { SPIN_SKILL } from '@views/ride/model/runner-control/services/spinSkill';
import { GroundShadow } from '@views/ride/ui/runner/GroundShadow';
import { Runner } from '@views/ride/ui/runner/Runner';
import { SpinStardust } from '@views/ride/ui/runner/SpinStardust';
import { SprintTrail } from '@views/ride/ui/runner/SprintTrail';
import { WadeSplash } from '@views/ride/ui/runner/WadeSplash';

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
