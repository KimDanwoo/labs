'use client';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Group, InstancedMesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { terrainHeightAt } from '../../config/scene';
import { makeSurfaceBump, SURFACE_KIND } from '../../lib/makeSurfaceBump';
import { LANDMARKS } from '../../model/exploration/world';
import { runnerState } from '../../model/ride-state/runnerState';
import { useLowDetail } from '../../model/ride-state/sceneQuality';
import { crossedArch } from '../../model/wildlife/behavior';

export function SunsetArch() {
  const low = useLowDetail();
  const stone = useMemo(() => new RoundedBoxGeometry(1, 1, 1, low ? 1 : 2, 0.08), [low]);
  const surface = useMemo(() => makeSurfaceBump(SURFACE_KIND.stone), []);
  useEffect(() => () => stone.dispose(), [stone]);
  useEffect(() => () => surface.dispose(), [surface]);
  const floating = useRef<Group>(null),
    glyph = useRef<MeshBasicMaterial>(null),
    particles = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D()),
    previous = useRef<Vector3 | null>(null),
    burst = useRef(-100);
  const place = LANDMARKS[2],
    ground = terrainHeightAt(place.x, place.z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime,
      p = runnerState.position;
    if (previous.current && t - burst.current > 3 && crossedArch(previous.current, p, place.x, ground, place.z))
      burst.current = t;
    if (!previous.current) previous.current = new Vector3();
    previous.current.copy(p);
    const age = t - burst.current,
      glow = Math.max(0, 1 - age / 3);
    if (glyph.current) glyph.current.opacity = 0.15 + glow * 0.85;
    if (floating.current) {
      floating.current.position.y = Math.sin(t * 0.7) * 0.25;
      floating.current.rotation.y = Math.sin(t * 0.2) * 0.04;
    }
    if (!particles.current) return;
    particles.current.visible = age < 3;
    if (age >= 3) return;
    for (let i = 0; i < 64; i++) {
      const a = i * 2.39996,
        r = 2 + age * 1.8 + (i % 5);
      const d = dummy.current;
      d.position.set(Math.cos(a) * r, 3 + (i % 9) + age * 4, Math.sin(a) * r * 0.4);
      d.rotation.set(t, a, t * 0.7);
      d.scale.setScalar((0.05 + (i % 4) * 0.025) * glow);
      d.updateMatrix();
      particles.current.setMatrixAt(i, d.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          {Array.from({ length: 4 }, (_, i) => (
            <mesh
              key={i}
              position={[side * (7 + (i % 2) * 0.12), 1.1 + i * 2.2, 0]}
              rotation={[0.025 * i, side * 0.06, side * 0.025]}
              geometry={stone}
              scale={[3.1 - i * 0.12, 2.1, 3.4]}
              castShadow
            >
              <meshStandardMaterial
                color={i % 2 ? '#aaa18b' : '#bcb29b'}
                roughness={0.9}
                bumpMap={surface}
                bumpScale={0.1}
              />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((i + 0.5) * Math.PI) / 11;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 7, 9 + Math.sin(a) * 7, ((i % 3) - 1) * 0.2]}
            rotation={[0, 0, a - Math.PI / 2 + (i % 2) * 0.035]}
            geometry={stone}
            scale={[2.1, 2.8, 3.2]}
            castShadow
          >
            <meshStandardMaterial
              color={i % 2 ? '#c4b79e' : '#a99d88'}
              roughness={0.9}
              bumpMap={surface}
              bumpScale={0.1}
            />
          </mesh>
        );
      })}
      <group ref={floating}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={i}
            position={[Math.cos(i * 2.4) * (8 + (i % 3)), 15 + (i % 4), Math.sin(i * 2.4) * 2]}
            rotation={[i, i * 0.4, i]}
            castShadow
          >
            <dodecahedronGeometry args={[0.35 + (i % 3) * 0.2, 0]} />
            <meshStandardMaterial color="#b7b29b" roughness={0.9} bumpMap={surface} bumpScale={0.08} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 9, -1.8]}>
        <torusGeometry args={[7, 0.055, 4, 48, Math.PI]} />
        <meshBasicMaterial
          ref={glyph}
          color="#ffe2a0"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <instancedMesh ref={particles} args={[undefined, undefined, 64]} frustumCulled={false} visible={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffe9af" blending={AdditiveBlending} transparent depthWrite={false} />
      </instancedMesh>
    </>
  );
}
