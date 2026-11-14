import { color, Fn, mix, texture, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';

type Vec2Node = THREE.Node<'vec2'>;
type Vec4Node = THREE.Node<'vec4'>;

const SUBDIVISION = 128;
const SIZE = 192;
const UV_SCALE = 1.5;
const GRADIENT_HEIGHT = 16;
const GRADIENT = [
  { stop: 0.1, value: '#f2d7a5' },
  { stop: 0.3, value: '#42c9c6' },
  { stop: 0.9, value: '#14658b' },
] as const;
const GRASS_COLOR = '#79b94d';
const TICK_ORDER = 10;

function gradientTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = GRADIENT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  const gradient = context.createLinearGradient(0, 0, 0, GRADIENT_HEIGHT);
  for (const { stop, value } of GRADIENT) gradient.addColorStop(stop, value);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, GRADIENT_HEIGHT);
  const result = new THREE.Texture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.needsUpdate = true;
  return result;
}

export class Terrain {
  readonly game = getGame();
  readonly size = SIZE;
  readonly subdivision = SUBDIVISION;
  readonly colors = GRADIENT;
  readonly grassColorUniform = uniform(color(GRASS_COLOR));
  readonly #tracksDelta = uniform(vec2(0));
  readonly #gradient = gradientTexture();

  readonly terrainNode = Fn(([position]: [Vec2Node]): Vec4Node => {
    const { tracks } = this.game;
    const data = texture(this.game.texture('terrainTexture'), position.div(SUBDIVISION).div(UV_SCALE).add(0.5));
    const groundTrack = texture(
      tracks.renderTarget.texture,
      position.sub(-tracks.halfSize).sub(this.#tracksDelta).div(tracks.size),
    );
    data.g.mulAssign(groundTrack.r.oneMinus());
    return data;
  });

  readonly colorNode = Fn(([terrainData]: [Vec4Node]): THREE.Node<'vec3'> => {
    const baseColor = texture(this.#gradient, vec2(0, terrainData.b.oneMinus()));
    baseColor.assign(mix(baseColor, this.grassColorUniform, terrainData.g));
    return baseColor.rgb;
  });

  constructor() {
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  update(): void {
    this.#tracksDelta.value.set(this.game.tracks.focusPoint.x, this.game.tracks.focusPoint.y);
  }
}
