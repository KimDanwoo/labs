import { useFrame } from '@react-three/fiber';
import { timeUniform } from '@views/ride/lib/flora/floraField';
import { placeFlora } from '@views/ride/lib/flora/placeFlora';
import { floraCellOf } from '@views/ride/model/flora/constants';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { InstancedMesh } from 'three';

export interface FloraMeshRefs {
  trunk: RefObject<InstancedMesh | null>;
  canopy: RefObject<InstancedMesh | null>;
  farCanopy: RefObject<InstancedMesh | null>;
  cone: RefObject<InstancedMesh | null>;
  rock: RefObject<InstancedMesh | null>;
  shadow: RefObject<InstancedMesh | null>;
}

export function useFloraPlacement(refs: FloraMeshRefs, viewRadius: number, coarse: boolean): void {
  const centerRef = useRef({ x: Number.NaN, z: Number.NaN });

  useLayoutEffect(() => {
    centerRef.current = { x: Number.NaN, z: Number.NaN };
  }, [viewRadius]);

  useFrame((state) => {
    timeUniform.value = state.clock.elapsedTime;
    const cx = floraCellOf(state.camera.position.x);
    const cz = floraCellOf(state.camera.position.z);
    if (cx === centerRef.current.x && cz === centerRef.current.z) return;
    centerRef.current = { x: cx, z: cz };
    const { trunk, canopy, farCanopy, cone, rock, shadow } = refs;
    if (!trunk.current || !canopy.current || !farCanopy.current || !cone.current || !rock.current || !shadow.current)
      return;
    const meshes = {
      trunk: trunk.current,
      canopy: canopy.current,
      farCanopy: farCanopy.current,
      cone: cone.current,
      rock: rock.current,
      shadow: shadow.current,
    };
    placeFlora(meshes, cx, cz, viewRadius, coarse);
  });
}
