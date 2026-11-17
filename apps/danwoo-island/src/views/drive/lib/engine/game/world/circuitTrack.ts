import { color, float, Fn, PI, positionWorld, texture, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { TICK_ORDER } from '../tickOrder';
import { closedCurve } from './layout/curves';
import { type Point, TRACK } from './layout/islandLayout';

const SAMPLES_PER_SPAN = 16;
const ROAD_LIFT = 0.03;
const ROAD_COLOR = '#384246';
const GLITTER = { scarcity: 100, intensity: 0.3, perlin: 0.05, hash: 0.2, time: 0.004, view: 0.004 } as const;

function isOverWater([x, z]: Point): boolean {
  const { from, to } = TRACK.waterJump;
  return (
    x > Math.min(from[0], to[0]) &&
    x < Math.max(from[0], to[0]) &&
    z > Math.min(from[1], to[1]) &&
    z < Math.max(from[1], to[1])
  );
}

function ribbonGeometry(centerline: readonly Point[]): THREE.BufferGeometry {
  const half = TRACK.width / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let distance = 0;
  centerline.forEach((point, index) => {
    const previous = centerline[(index - 1 + centerline.length) % centerline.length] ?? point;
    const next = centerline[(index + 1) % centerline.length] ?? point;
    const tangent = new THREE.Vector2(next[0] - previous[0], next[1] - previous[1]).normalize();
    if (index > 0) distance += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    for (const side of [-1, 1]) {
      positions.push(point[0] - tangent.y * half * side, ROAD_LIFT, point[1] + tangent.x * half * side);
      uvs.push(distance / TRACK.width, side < 0 ? 0 : 1);
    }
  });
  centerline.forEach((point, index) => {
    const nextIndex = (index + 1) % centerline.length;
    const next = centerline[nextIndex] ?? point;
    if (isOverWater(point) || isOverWater(next)) return;
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

function roadMaterial(glitterVariation: THREE.UniformNode<'float', number>): MeshDefaultMaterial {
  const { noises } = getGame();
  const colorNode = Fn(() => {
    const glitter = float(0);
    const hash = texture(noises.hash, positionWorld.xz.mul(GLITTER.hash))
      .r.mul(2)
      .add(glitterVariation)
      .mod(2)
      .sub(1)
      .abs();
    glitter.addAssign(hash);
    glitter.assign(glitter.pow(GLITTER.scarcity));
    glitter.mulAssign(GLITTER.intensity);
    glitter.mulAssign(texture(noises.perlin, positionWorld.xz.mul(GLITTER.perlin)).r);
    glitter.mulAssign(uv().y.mul(PI).sin());
    const baseColor = uniform(color(ROAD_COLOR)).rgb.toVar();
    baseColor.addAssign(glitter);
    return vec3(baseColor);
  })();
  return new MeshDefaultMaterial({ colorNode, hasLightBounce: false, hasWater: false });
}

export class CircuitTrack {
  readonly #glitterVariation = uniform(0);

  constructor() {
    const game = getGame();
    const road = new THREE.Mesh(
      ribbonGeometry(closedCurve(TRACK.centerline, SAMPLES_PER_SPAN)),
      roadMaterial(this.#glitterVariation),
    );
    road.name = 'circuitRoad';
    road.receiveShadow = true;
    game.objects.add({ model: road, updateMaterials: false, castShadow: false });
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.scenery);
  }

  update(): void {
    const { ticker, view } = getGame();
    this.#glitterVariation.value += ticker.deltaScaled * GLITTER.time + view.delta.length() * GLITTER.view;
  }
}
