import * as THREE from 'three/webgpu';

import { isOverWaterJump, sideOf, type TrackSample } from '@views/drive/lib/engine/game/world/layout/trackPath';

interface StripEdge {
  readonly offset: number;
  readonly height: number;
}

interface Strip {
  readonly from: StripEdge;
  readonly to: StripEdge;
}

function edgePoint({ point, forward }: TrackSample, { offset, height }: StripEdge): THREE.Vector3 {
  const [sideX, sideZ] = sideOf(forward);
  return new THREE.Vector3(point[0] + sideX * offset, height, point[1] + sideZ * offset);
}

const isOpen = (sample: TrackSample): boolean => !isOverWaterJump(sample.point);

export function stripGeometry(samples: readonly TrackSample[], { from, to }: Strip): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const sample of samples) {
    positions.push(...edgePoint(sample, from).toArray(), ...edgePoint(sample, to).toArray());
    uvs.push(sample.distance, 0, sample.distance, 1);
  }
  samples.forEach((sample, index) => {
    const nextIndex = (index + 1) % samples.length;
    const next = samples[nextIndex];
    if (!next) return;
    if (!isOpen(sample)) return;
    if (!isOpen(next)) return;
    const a = index * 2;
    const b = nextIndex * 2;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
