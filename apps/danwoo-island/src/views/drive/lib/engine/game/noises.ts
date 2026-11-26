import {
  ceil,
  dot,
  float,
  floor,
  Fn,
  fract,
  If,
  int,
  length,
  Loop,
  mix,
  mod,
  mul,
  sin,
  smoothstep,
  uv,
  vec2,
  vec3,
  vec4,
  viewportUV,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';

type FloatNode = THREE.Node<'float'>;
type Vec2Node = THREE.Node<'vec2'>;

const RESOLUTION = 128;
const VORONOI_REPEAT = 8;
const PERLIN_CELLS = 6;
const PERLIN_PERIOD = 6;
const PERLIN_RANGE = { low: 0.1, high: 0.9 } as const;
const PERLIN_CONTRAST = 0.8;
const PERLIN_OFFSET = 0.5;
const HASH_SEED_X = vec2(127.1, 311.7);
const HASH_SEED_Y = vec2(269.5, 183.3);
const HASH_SCALE = 43758.5453123;

const hash = Fn(([value]: [Vec2Node]): Vec2Node => {
  const seeded = vec2(dot(value, HASH_SEED_X), dot(value, HASH_SEED_Y));
  return fract(sin(seeded).mul(HASH_SCALE));
}).setLayout({ name: 'hash', type: 'vec2', inputs: [{ name: 'p', type: 'vec2' }] });

const voronoi = Fn(([position, repeat]: [Vec2Node, FloatNode]): THREE.Node<'vec3'> => {
  const scaled = position.mul(repeat);
  const cell = floor(scaled).toVar();
  const offset = fract(scaled).toVar();
  const nearest = float(1).toVar();
  const secondNearest = float(1).toVar();
  const nearestCell = vec2(0).toVar();

  const neighborRange = { start: int(-1), end: int(1), condition: '<=' };
  Loop(neighborRange, neighborRange, ({ i: y, j: x }) => {
    const neighbor = vec2(x, y).toVar();
    const point = hash(mod(cell.add(neighbor), repeat));
    const distance = length(neighbor.add(point.sub(offset))).toVar();

    If(distance.lessThan(nearest), () => {
      secondNearest.assign(nearest);
      nearest.assign(distance);
      nearestCell.assign(cell.add(neighbor));
    }).ElseIf(distance.lessThan(secondNearest), () => {
      secondNearest.assign(distance);
    });
  });

  const cellId = fract(nearestCell.div(repeat));
  return vec3(nearest, secondNearest.sub(nearest), hash(cellId).x);
}).setLayout({
  name: 'voronoi',
  type: 'vec3',
  inputs: [
    { name: 'uv', type: 'vec2' },
    { name: 'repeat', type: 'float' },
  ],
});

const positiveModulo = Fn(([dividend, divisor]: [Vec2Node, Vec2Node]): Vec2Node =>
  mod(mod(dividend, divisor).add(divisor), divisor),
).setLayout({
  name: 'modulo',
  type: 'vec2',
  inputs: [
    { name: 'divident', type: 'vec2' },
    { name: 'divisor', type: 'vec2' },
  ],
});

const randomDirection = Fn(([value]: [Vec2Node]): Vec2Node => {
  const seeded = vec2(dot(value, HASH_SEED_X), dot(value, HASH_SEED_Y));
  return float(-1).add(mul(2, fract(sin(seeded).mul(HASH_SCALE))));
}).setLayout({ name: 'random', type: 'vec2', inputs: [{ name: 'value', type: 'vec2' }] });

const perlin = Fn(([position, cellAmount, period]: [Vec2Node, FloatNode, Vec2Node]): FloatNode => {
  const scaled = position.mul(cellAmount).toVar();
  const low = positiveModulo(floor(scaled), period).toVar();
  const high = positiveModulo(ceil(scaled), period).toVar();
  const fraction = fract(scaled).toVar();
  const blur = smoothstep(0, 1, fraction).toVar();
  const corner = (cornerCell: Vec2Node, cornerOffset: Vec2Node): FloatNode =>
    dot(randomDirection(cornerCell), fraction.sub(cornerOffset));

  const bottom = mix(corner(vec2(low.x, low.y), vec2(0, 0)), corner(vec2(high.x, low.y), vec2(1, 0)), blur.x);
  const top = mix(corner(vec2(low.x, high.y), vec2(0, 1)), corner(vec2(high.x, high.y), vec2(1, 1)), blur.x);
  return mix(bottom, top, blur.y).mul(PERLIN_CONTRAST).add(PERLIN_OFFSET);
}).setLayout({
  name: 'perlinNode',
  type: 'float',
  inputs: [
    { name: 'uv', type: 'vec2' },
    { name: 'cell_amount', type: 'float' },
    { name: 'period', type: 'vec2' },
  ],
});

function renderToTarget(quad: THREE.QuadMesh, renderTarget: THREE.RenderTarget): void {
  const { renderer } = getGame().rendering;
  const state = THREE.RendererUtils.resetRendererState(renderer, THREE.RendererUtils.saveRendererState(renderer));
  renderer.setPixelRatio(1);
  renderer.setRenderTarget(renderTarget);
  quad.render(renderer);
  renderer.setRenderTarget(null);
  THREE.RendererUtils.restoreRendererState(renderer, state);
}

interface BakeOptions {
  format?: THREE.PixelFormat;
  filter?: THREE.MagnificationTextureFilter;
}

function bakeTexture(outputNode: THREE.Node<'vec4'>, { format, filter }: BakeOptions = {}): THREE.Texture {
  const renderTarget = new THREE.RenderTarget(RESOLUTION, RESOLUTION, {
    depthBuffer: false,
    type: THREE.HalfFloatType,
    ...(format === undefined ? {} : { format }),
  });
  const { texture } = renderTarget;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (filter !== undefined) {
    texture.minFilter = filter;
    texture.magFilter = filter;
  }

  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = outputNode;
  renderToTarget(new THREE.QuadMesh(material), renderTarget);
  return texture;
}

export class Noises {
  readonly resolution = RESOLUTION;
  readonly voronoi: THREE.Texture;
  readonly perlin: THREE.Texture;
  readonly hash: THREE.Texture;

  constructor() {
    this.voronoi = bakeTexture(vec4(voronoi(uv(), float(VORONOI_REPEAT)), 0));
    this.perlin = bakeTexture(
      vec4(
        perlin(uv(), float(PERLIN_CELLS), vec2(PERLIN_PERIOD)).remap(PERLIN_RANGE.low, PERLIN_RANGE.high, 0, 1),
        hash(uv().mul(RESOLUTION).floor().div(RESOLUTION)).x,
        0,
        0,
      ),
      { format: THREE.RedFormat },
    );
    this.hash = bakeTexture(vec4(hash(viewportUV).x, 0, 0, 0), {
      format: THREE.RedFormat,
      filter: THREE.NearestFilter,
    });
  }
}
