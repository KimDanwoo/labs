import { color, Fn, mix, positionWorld, smoothstep, texture, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

import { COVE } from '@views/drive/lib/engine/game/world/layout/tideCove';

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
const GRASS_COLOR = '#91ac72';
const GROVE_COLOR = '#658d66';

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
  readonly #groveColor = uniform(color(GROVE_COLOR));
  readonly #tracksDelta = uniform(vec2(0));
  readonly #gradient = gradientTexture();

  readonly trackUvNode = Fn(([position]: [Vec2Node]) =>
    position.add(this.game.tracks.halfSize).sub(this.#tracksDelta).div(this.game.tracks.size),
  );

  readonly terrainNode = Fn(([position]: [Vec2Node]): Vec4Node => {
    const { tracks } = this.game;
    const data = texture(this.game.texture('terrainTexture'), position.div(SUBDIVISION).div(UV_SCALE).add(0.5));
    const radius = position.sub(vec2(COVE.x, COVE.z)).div(vec2(COVE.rx, COVE.rz)).length();
    const hiddenDepth = radius.smoothstep(0.82, 1.06).oneMinus().mul(position.x.sub(COVE.startX).div(6).clamp());
    data.b.assign(mix(data.b.max(hiddenDepth), data.b, this.game.water.tide));
    const groundTrack = texture(tracks.renderTarget.texture, this.trackUvNode(position));
    const grain = texture(this.game.noises.perlin, position.mul(0.34)).r;
    const edge = data.g.add(grain.sub(0.5).mul(0.55));
    const cover = smoothstep(0.18, 0.86, edge).mul(grain.mul(0.28).add(0.72));
    data.g.assign(cover.mul(groundTrack.r.oneMinus()).mul(smoothstep(0, 0.18, data.g)));
    return data;
  });

  readonly colorNode = Fn(([terrainData]: [Vec4Node]): THREE.Node<'vec3'> => {
    const baseColor = texture(
      this.#gradient,
      vec2(0, terrainData.b.sub(this.game.water.dropNode(positionWorld.xz).div(1.5)).clamp(0, 1).oneMinus()),
    );
    const foliage = mix(this.grassColorUniform, this.#groveColor, smoothstep(0.65, 0.97, terrainData.g));
    baseColor.assign(mix(baseColor, foliage, terrainData.g));
    return baseColor.rgb;
  });

  constructor() {
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER.terrain);
  }

  update(): void {
    this.#tracksDelta.value.set(this.game.tracks.focusPoint.x, this.game.tracks.focusPoint.y);
  }
}
