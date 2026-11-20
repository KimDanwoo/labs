'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, Group } from 'three';
import { ELDER_TREE } from '../../config/elderTree';
import { crownClusters, rootBranches } from '../../lib/exploration/elderTree';
import { makeLeafCanopy } from '../../lib/makeLeafCanopy';
import { useDispose } from '../../model/hooks/useDispose';

import { Branch } from './Branch';
import { SilverLeaves } from './SilverLeaves';

export function ElderTree() {
  const { crownCanopy, tipCanopy, trunk, sway, leafRoughness } = ELDER_TREE;
  const leaves = useMemo(
    () => ({
      crown: makeLeafCanopy(crownCanopy.radius, crownCanopy.leaves),
      tips: makeLeafCanopy(tipCanopy.radius, tipCanopy.leaves),
    }),
    [crownCanopy, tipCanopy],
  );
  useDispose(leaves);
  const roots = useMemo(() => rootBranches(), []);
  const crown = useMemo(() => crownClusters(), []);
  const crownRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (crownRef.current) crownRef.current.rotation.z = Math.sin(clock.elapsedTime * sway.rate) * sway.amplitude;
  });
  return (
    <>
      <Branch points={trunk.points} radius={trunk.radius} />
      {roots.map((root) => (
        <Branch key={root.key} points={root.points} radius={root.radius} />
      ))}
      <group ref={crownRef}>
        {crown.clusters.map((cluster, i) => (
          <group key={cluster.key}>
            <Branch points={crown.branches[i]!.points} radius={crown.branches[i]!.radius} />
            <mesh geometry={leaves.crown} position={cluster.position} scale={ELDER_TREE.crownScale} castShadow>
              <meshStandardMaterial vertexColors side={DoubleSide} color={cluster.color} roughness={leafRoughness} />
            </mesh>
            <mesh geometry={leaves.tips} position={cluster.tipPosition} scale={ELDER_TREE.tipScale}>
              <meshStandardMaterial vertexColors side={DoubleSide} color="#bcc6a3" roughness={leafRoughness} />
            </mesh>
          </group>
        ))}
        <SilverLeaves />
      </group>
    </>
  );
}
