'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Group, MathUtils, Vector3, type Object3D } from 'three';
import { makeWingGeometry } from '../../lib/runner/makeWingGeometry';
import { runnerState } from '../../model/ride-state/runnerState';
import { WINGS } from '../../model/runner/constants';
import { FeatherWing } from './FeatherWing';

type MagicWingsProps = { anchor: Object3D };

export function MagicWings({ anchor }: MagicWingsProps) {
  const rootRef = useRef<Group>(null);
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const leftTrimRef = useRef<Group>(null);
  const rightTrimRef = useRef<Group>(null);
  const openRef = useRef(0);
  const phaseRef = useRef(0);
  const point = useMemo(() => new Vector3(), []);
  const geometry = useMemo(() => makeWingGeometry(WINGS.span, WINGS.feathers), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const root = rootRef.current;
    if (!root) return;
    anchor.getWorldPosition(point);
    root.parent?.worldToLocal(point);
    root.position.copy(point);
    const falling = MathUtils.smoothstep(-runnerState.verticalSpeed, 0.5, 5);
    const landingFlare = (1 - MathUtils.smoothstep(runnerState.airborneHeight, 0.6, 2.4)) * falling;
    const target =
      MathUtils.smoothstep(runnerState.airborneHeight, 0.15, 0.9) * (1 - falling * 0.65 + landingFlare * 0.55);
    openRef.current = MathUtils.damp(openRef.current, target, 6, delta);
    const open = openRef.current;
    root.visible = true;
    const rising = MathUtils.smoothstep(runnerState.verticalSpeed, -0.3, 2);
    const flare =
      (1 - MathUtils.smoothstep(runnerState.airborneHeight, 0.4, 3)) * (runnerState.verticalSpeed < 0 ? 1 : 0);
    phaseRef.current += MathUtils.lerp(WINGS.flapSpeedAir, WINGS.flapSpeedRising, rising) * delta;
    const flap =
      MathUtils.lerp(0.16, WINGS.openAngleBase, rising) +
      Math.sin(phaseRef.current) * MathUtils.lerp(0.1, WINGS.flapAmplitude, rising) +
      flare * 0.22;
    const angle = MathUtils.lerp(WINGS.foldedAngle, flap, open);
    const size = MathUtils.lerp(WINGS.foldedScale, 1, open);
    const isTrimVisible = open > WINGS.trimVisibleOpen;
    if (leftTrimRef.current) leftTrimRef.current.visible = isTrimVisible;
    if (rightTrimRef.current) rightTrimRef.current.visible = isTrimVisible;
    if (leftRef.current) {
      leftRef.current.rotation.z = -angle;
      leftRef.current.rotation.x = (-Math.PI / 2) * (1 - open);
      leftRef.current.rotation.y = -1.25 * (1 - open);
      leftRef.current.scale.setScalar(size);
    }
    if (rightRef.current) {
      rightRef.current.rotation.z = angle;
      rightRef.current.rotation.x = (-Math.PI / 2) * (1 - open);
      rightRef.current.rotation.y = 1.25 * (1 - open);
      rightRef.current.scale.setScalar(size);
    }
  });

  const [rootX, rootY, rootZ] = WINGS.root;
  return (
    <group ref={rootRef} visible={false}>
      <group ref={leftRef} position={[-rootX, rootY, rootZ]} rotation={[0, 0, 0, 'YXZ']}>
        <FeatherWing geometry={geometry} trimRef={leftTrimRef} mirror />
      </group>
      <group ref={rightRef} position={[rootX, rootY, rootZ]} rotation={[0, 0, 0, 'YXZ']}>
        <FeatherWing geometry={geometry} trimRef={rightTrimRef} />
      </group>
    </group>
  );
}
