'use client';

import { useFrame } from '@react-three/fiber';
import { updateMagicWings, type WingMemory } from '@views/ride/lib/runner/magicWings';
import { makeWingGeometry } from '@views/ride/lib/runner/makeWingGeometry';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { WINGS } from '@views/ride/model/runner/constants';
import { FeatherWing } from '@views/ride/ui/runner/FeatherWing';
import { useMemo, useRef } from 'react';
import { Group, Vector3, type Object3D } from 'three';

interface MagicWingsProps {
  anchor: Object3D;
}

export function MagicWings({ anchor }: MagicWingsProps) {
  const rootRef = useRef<Group>(null);
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const leftTrimRef = useRef<Group>(null);
  const rightTrimRef = useRef<Group>(null);
  const memory = useRef<WingMemory>({ open: 0, phase: 0 });
  const point = useMemo(() => new Vector3(), []);
  const geometry = useMemo(() => makeWingGeometry(WINGS.span, WINGS.feathers), []);
  useDispose(geometry);

  useFrame((_, rawDelta) => {
    if (!rootRef.current) return;
    const rig = {
      root: rootRef.current,
      left: leftRef.current,
      right: rightRef.current,
      leftTrim: leftTrimRef.current,
      rightTrim: rightTrimRef.current,
    };
    updateMagicWings(rig, anchor, point, memory.current, rawDelta);
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
