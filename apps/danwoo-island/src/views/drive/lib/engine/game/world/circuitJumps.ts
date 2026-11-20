import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { type IslandModelKey, islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import { TRACK } from '@views/drive/lib/engine/game/world/layout/islandLayout';
import {
  isOverWaterJump,
  nearestSample,
  sideOf,
  type TrackSample,
  trackSamples,
} from '@views/drive/lib/engine/game/world/layout/trackPath';

const SAMPLE_SPACING = 0.5;
const TAKEOFF = { length: 9, height: 1.8 } as const;
const LANDING = { length: 8, height: 1 } as const;
const KICKER = { length: 3, height: 0.45, tail: 0.6 } as const;

type Profile = (along: number) => number;

interface Ramp {
  readonly model: IslandModelKey;
  readonly from: number;
  readonly to: number;
  readonly height: Profile;
}

function samplesBetween(samples: readonly TrackSample[], { from, to }: Ramp): TrackSample[] {
  const length = samples.length * SAMPLE_SPACING;
  const count = Math.round((to - from) / SAMPLE_SPACING);
  return Array.from({ length: count + 1 }, (_, index) => {
    const distance = (((from + index * SAMPLE_SPACING) % length) + length) % length;
    const sample = samples[Math.round(distance / SAMPLE_SPACING) % samples.length];
    if (!sample) throw new Error('점프대 샘플이 비어 있어요.');
    return { ...sample, distance: index * SAMPLE_SPACING };
  });
}

function rampCorners(sample: TrackSample, height: number): THREE.Vector3[] {
  const half = TRACK.width / 2;
  const [sideX, sideZ] = sideOf(sample.forward);
  const [x, z] = sample.point;
  return [
    new THREE.Vector3(x - sideX * half, height, z - sideZ * half),
    new THREE.Vector3(x + sideX * half, height, z + sideZ * half),
    new THREE.Vector3(x + sideX * half, 0, z + sideZ * half),
    new THREE.Vector3(x - sideX * half, 0, z - sideZ * half),
  ];
}

function rampGeometry(rings: readonly THREE.Vector3[][]): THREE.BufferGeometry {
  const positions = rings.flat().flatMap((corner) => corner.toArray());
  const indices: number[] = [];
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    const a = ring * 4;
    const b = a + 4;
    for (let edge = 0; edge < 4; edge += 1) {
      const next = (edge + 1) % 4;
      indices.push(a + edge, b + edge, a + next, a + next, b + edge, b + next);
    }
  }
  const last = (rings.length - 1) * 4;
  indices.push(0, 1, 2, 0, 2, 3, last, last + 2, last + 1, last, last + 3, last + 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function waterCrossing(samples: readonly TrackSample[]): { entry: number; exit: number } {
  const overWater = samples.filter((sample) => isOverWaterJump(sample.point)).map(({ distance }) => distance);
  if (!overWater.length) throw new Error('트랙이 수로를 지나지 않아요.');
  return { entry: Math.min(...overWater), exit: Math.max(...overWater) + SAMPLE_SPACING };
}

function circuitRamps(samples: readonly TrackSample[]): Ramp[] {
  const { entry, exit } = waterCrossing(samples);
  const kickers = TRACK.kickers.map((point): Ramp => {
    const center = nearestSample(samples, point).distance;
    return {
      model: 'jumpKicker',
      from: center - KICKER.length,
      to: center + KICKER.tail,
      height: (along) => KICKER.height * Math.min(1, along / KICKER.length),
    };
  });
  return [
    {
      model: 'jumpTakeoff',
      from: entry - TAKEOFF.length,
      to: entry,
      height: (along) => (TAKEOFF.height * along) / TAKEOFF.length,
    },
    {
      model: 'jumpLanding',
      from: exit,
      to: exit + LANDING.length,
      height: (along) => LANDING.height * (1 - along / LANDING.length),
    },
    ...kickers,
  ];
}

function rampModel(model: IslandModelKey, { point, forward }: TrackSample): THREE.Mesh {
  const heading = Math.atan2(-forward[0], -forward[1]);
  const matrix = new THREE.Matrix4()
    .makeTranslation(point[0], 0, point[1])
    .multiply(new THREE.Matrix4().makeRotationY(heading));
  return islandModelMesh(model, matrix);
}

export function buildCircuitJumps(): void {
  const { objects } = getGame();
  const samples = trackSamples(SAMPLE_SPACING);
  for (const ramp of circuitRamps(samples)) {
    const along = samplesBetween(samples, ramp);
    const first = along[0];
    const hull = rampGeometry(along.map((sample) => rampCorners(sample, ramp.height(sample.distance)))).attributes
      .position?.array;
    if (!first) continue;
    if (!(hull instanceof Float32Array)) continue;
    objects.add(
      { model: rampModel(ramp.model, first) },
      { type: 'fixed', colliders: [{ shape: 'hull', parameters: [hull] }] },
    );
  }
}
