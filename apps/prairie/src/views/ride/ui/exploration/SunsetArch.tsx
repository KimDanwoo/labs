'use client';
import { useFrame } from '@react-three/fiber';
import { SUNSET_ARCH } from '@views/ride/config/sunsetArch';
import {
  floatingRocks,
  glowAt,
  glyphOpacity,
  hoverFloatingRocks,
  keystoneBlocks,
  pillarBlocks,
  placeArchParticles,
  trackedPosition,
} from '@views/ride/lib/exploration/sunsetArch';
import { makeSurfaceBump, SURFACE_KIND } from '@views/ride/lib/makeSurfaceBump';
import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import { LANDMARKS } from '@views/ride/model/exploration/world';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { crossedArch } from '@views/ride/model/wildlife/behavior';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Group, InstancedMesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function SunsetArch() {
  const low = useLowDetail();
  const { surface: look, stoneSegments, stoneRadius, glyph: glyphShape, burstSeconds } = SUNSET_ARCH;
  const stone = useMemo(
    () => new RoundedBoxGeometry(1, 1, 1, low ? stoneSegments.low : stoneSegments.high, stoneRadius),
    [low, stoneSegments, stoneRadius],
  );
  const surface = useMemo(() => makeSurfaceBump(SURFACE_KIND.stone), []);
  const pillars = useMemo(() => pillarBlocks(), []);
  const keystones = useMemo(() => keystoneBlocks(), []);
  const rocks = useMemo(() => floatingRocks(), []);
  useDispose(stone);
  useDispose(surface);
  const floating = useRef<Group>(null),
    glyph = useRef<MeshBasicMaterial>(null),
    particles = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D()),
    previous = useRef<Vector3 | null>(null),
    burst = useRef(SUNSET_ARCH.burstIdle);
  const place = LANDMARKS[2],
    ground = terrainHeightAt(place.x, place.z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime,
      p = runnerState.position;
    const crossed = previous.current && crossedArch(previous.current, p, place.x, ground, place.z);
    if (crossed && t - burst.current > burstSeconds) burst.current = t;
    previous.current = trackedPosition(previous.current, p);
    const age = t - burst.current,
      glow = glowAt(age);
    if (glyph.current) glyph.current.opacity = glyphOpacity(glow);
    if (floating.current) hoverFloatingRocks(floating.current, t);
    if (!particles.current) return;
    particles.current.visible = age < burstSeconds;
    if (age >= burstSeconds) return;
    placeArchParticles(particles.current, dummy.current, t, age, glow);
  });
  return (
    <>
      {[...pillars, ...keystones].map((block) => (
        <mesh
          key={block.key}
          position={block.position}
          rotation={block.rotation}
          geometry={stone}
          scale={block.scale}
          castShadow
        >
          <meshStandardMaterial
            color={block.color}
            roughness={look.roughness}
            bumpMap={surface}
            bumpScale={look.bumpScale}
          />
        </mesh>
      ))}
      <group ref={floating}>
        {rocks.map((rock) => (
          <mesh key={rock.key} position={rock.position} rotation={rock.rotation} castShadow>
            <dodecahedronGeometry args={[rock.radius, 0]} />
            <meshStandardMaterial
              color="#b7b29b"
              roughness={look.roughness}
              bumpMap={surface}
              bumpScale={look.rockBumpScale}
            />
          </mesh>
        ))}
      </group>
      <mesh position={glyphShape.position}>
        <torusGeometry args={glyphShape.args} />
        <meshBasicMaterial
          ref={glyph}
          color="#ffe2a0"
          transparent
          opacity={glyphShape.idleOpacity}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <instancedMesh
        ref={particles}
        args={[undefined, undefined, SUNSET_ARCH.particles]}
        frustumCulled={false}
        visible={false}
      >
        <octahedronGeometry args={SUNSET_ARCH.particleGeometry} />
        <meshBasicMaterial color="#ffe9af" blending={AdditiveBlending} transparent depthWrite={false} />
      </instancedMesh>
    </>
  );
}
