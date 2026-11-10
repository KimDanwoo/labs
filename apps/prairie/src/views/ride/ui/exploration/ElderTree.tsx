'use client';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, Group } from 'three';
import { makeLeafCanopy } from '../../lib/makeLeafCanopy';

import { Branch } from './Branch';
import { SilverLeaves } from './SilverLeaves';

export function ElderTree() {
  const leaves = useMemo(() => ({ crown: makeLeafCanopy(3.6, 240), tips: makeLeafCanopy(2.6, 140) }), []);
  useEffect(() => () => Object.values(leaves).forEach((geometry) => geometry.dispose()), [leaves]);
  const crown = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (crown.current) crown.current.rotation.z = Math.sin(clock.elapsedTime * 0.45) * 0.012;
  });
  return (
    <>
      <Branch
        points={[
          [0, 0, 0],
          [-1.4, 4, 0.2],
          [-0.5, 9, 0],
          [2, 14, 0],
        ]}
        radius={1.5}
      />
      {Array.from({ length: 5 }, (_, i) => {
        const a = i * 1.256;
        return (
          <Branch
            key={i}
            points={[
              [0, 1, 0],
              [Math.cos(a) * 2, 0.5, Math.sin(a) * 2],
              [Math.cos(a) * 4, -0.2, Math.sin(a) * 4],
            ]}
            radius={0.45}
          />
        );
      })}
      <group ref={crown}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = i * 2.39996,
            x = Math.cos(a) * (8 + (i % 3)),
            z = Math.sin(a) * (7 + (i % 4)),
            y = 13 + (i % 4);
          return (
            <group key={i}>
              <Branch
                points={[
                  [-0.5, 8 + (i % 3), 0],
                  [x * 0.45, y - 2, z * 0.4],
                  [x, y, z],
                ]}
                radius={0.35 + (i % 2) * 0.15}
              />
              <mesh geometry={leaves.crown} position={[x, y, z]} scale={[1.6, 0.65, 1.1]} castShadow>
                <meshStandardMaterial
                  vertexColors
                  side={DoubleSide}
                  color={i % 2 ? '#9dac88' : '#748c6a'}
                  roughness={0.85}
                />
              </mesh>
              <mesh geometry={leaves.tips} position={[x + 1, y + 0.9, z - 0.7]} scale={[1.5, 0.4, 1]}>
                <meshStandardMaterial vertexColors side={DoubleSide} color="#bcc6a3" roughness={0.85} />
              </mesh>
            </group>
          );
        })}
        <SilverLeaves />
      </group>
    </>
  );
}
