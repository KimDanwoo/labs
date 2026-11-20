'use client';

import { useFrame } from '@react-three/fiber';
import {
  WINGED_ALERT_RADIUS,
  WINGED_BODY_COLOR,
  WINGED_BODY_GEOMETRY,
  WINGED_COUNT,
  WINGED_MAX_COUNT,
  WINGED_OPACITY,
  WINGED_POSITION_ITEM_SIZE,
  WINGED_WING_COUNT,
  WINGED_WING_DISC,
  type WingedKind,
} from '@views/ride/config/wingedLife';
import {
  isOffshoreDragonfly,
  placeWingedLife,
  riderDistance,
  settleHome,
  shapeInsectWing,
  type Anchor,
} from '@views/ride/lib/wildlife/wingedFlight';
import { wingPositions } from '@views/ride/lib/wildlife/wingedLife';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { createCreatureState, updateCreature } from '@views/ride/model/wildlife/behavior';
import { useRef } from 'react';
import { DoubleSide, InstancedMesh, Object3D } from 'three';

interface WingedLifeProps {
  kind: WingedKind;
  anchor?: Anchor;
}

export function WingedLife({ kind, anchor }: WingedLifeProps) {
  const mobile = useLowDetail();
  const count = mobile ? WINGED_COUNT.mobile : WINGED_COUNT.desktop;
  const wingCount = WINGED_WING_COUNT[kind];
  const wings = useRef<InstancedMesh>(null);
  const bodies = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D());
  const states = useRef(Array.from({ length: WINGED_MAX_COUNT }, createCreatureState));
  const homes = useRef(Array.from({ length: WINGED_MAX_COUNT }, () => ({ x: NaN, y: 0, z: 0 })));
  useFrame(({ clock }, delta) => {
    if (!wings.current) return;
    if (!bodies.current) return;
    const t = clock.elapsedTime;
    const rider = runnerState.position;
    const offshore = isOffshoreDragonfly(kind, anchor, rider);
    wings.current.visible = bodies.current.visible = !offshore;
    if (offshore) return;
    const meshes = { wings: wings.current, bodies: bodies.current };
    for (let i = 0; i < count; i++) {
      const home = homes.current[i]!;
      const state = states.current[i]!;
      settleHome(home, state, kind, anchor, rider, i);
      updateCreature(state, riderDistance(rider, home), WINGED_ALERT_RADIUS[kind], delta);
      placeWingedLife(meshes, dummy.current, { kind, anchor, wingCount }, home, state.alert, t, i);
    }
    wings.current.instanceMatrix.needsUpdate = true;
    bodies.current.instanceMatrix.needsUpdate = true;
    if (wings.current.instanceColor) wings.current.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={wings} args={[undefined, undefined, count * wingCount]} frustumCulled={false}>
        {kind === 'bird' && (
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[wingPositions, WINGED_POSITION_ITEM_SIZE]} />
          </bufferGeometry>
        )}
        {kind !== 'bird' && (
          <circleGeometry args={WINGED_WING_DISC.args} onUpdate={(geometry) => shapeInsectWing(geometry, kind)} />
        )}
        <meshBasicMaterial side={DoubleSide} transparent opacity={WINGED_OPACITY[kind]} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={WINGED_BODY_GEOMETRY} />
        <meshLambertMaterial color={WINGED_BODY_COLOR[kind]} />
      </instancedMesh>
    </group>
  );
}
