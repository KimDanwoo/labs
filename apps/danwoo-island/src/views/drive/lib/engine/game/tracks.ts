import {
  atan,
  cos,
  float,
  Fn,
  mul,
  positionGeometry,
  screenUV,
  sign,
  sin,
  texture,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';

export type TrackChannel = 'r' | 'g' | 'b';

const RESOLUTION = 512;
const AREA_SIZE = 40;
const CAMERA_HEIGHT = 5;
const TICK_ORDER = 9;
const SUBDIVISIONS = 128;
const RGBA = 4;
const TIME_THROTTLE = 1 / 30;
const DISTANCE_THROTTLE = 0.2;
const CHANNEL_COLOR = { r: [1, 0, 0], g: [0, 1, 0], b: [0, 0, 1] } as const satisfies Record<
  TrackChannel,
  readonly number[]
>;

export class Track {
  readonly game = getGame();
  readonly mesh: THREE.Mesh;
  readonly #data = new Float32Array(SUBDIVISIONS * RGBA);
  readonly #dataTexture = new THREE.DataTexture(this.#data, SUBDIVISIONS, 1, THREE.RGBAFormat, THREE.FloatType);
  readonly #lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  #lastTime = 0;

  constructor(thickness = 1, channel: TrackChannel = 'r') {
    const geometry = new THREE.PlaneGeometry(1, 1, SUBDIVISIONS, 1).translate(0.5, 0, 0);
    this.mesh = new THREE.Mesh(geometry, this.#material(thickness, channel));
    this.mesh.frustumCulled = false;
  }

  update(position: THREE.Vector3, isTouching: boolean): void {
    const elapsed = this.game.ticker.elapsed;
    const isDue =
      elapsed - this.#lastTime > TIME_THROTTLE && this.#lastPosition.distanceTo(position) > DISTANCE_THROTTLE;
    if (isDue) {
      this.#data.copyWithin(RGBA, 0, (SUBDIVISIONS - 1) * RGBA);
      this.#lastTime = elapsed;
      this.#lastPosition.copy(position);
    }
    this.#data.set([position.x, position.y, position.z, isTouching ? 1 : 0], 0);
    this.#dataTexture.needsUpdate = true;
  }

  #material(thickness: number, channel: TrackChannel): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial({
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const dataTexture = this.#dataTexture;
    const trackData = varying(vec4());
    material.positionNode = Fn(() => {
      const fragmentSize = float(1).div(SUBDIVISIONS);
      const ratio = uv().x.sub(fragmentSize.mul(0.5));
      trackData.assign(texture(dataTexture, vec2(ratio, 0.5)));
      const previous = texture(dataTexture, vec2(ratio.sub(fragmentSize), 0.5));
      const angle = atan(trackData.z.sub(previous.z), trackData.x.sub(previous.x));
      const side = sign(positionGeometry.y)
        .mul(-1)
        .mul(Math.PI * 0.5);
      const offset = vec2(cos(angle.add(side)), sin(angle.add(side))).mul(thickness);
      return vec3(trackData.x.add(offset.x), trackData.y, trackData.z.add(offset.y));
    })();
    material.outputNode = Fn(() => {
      const endAlpha = uv().x.smoothstep(0.5, 1).oneMinus();
      const startAlpha = uv().x.smoothstep(0, 0.05);
      const screenEdgeAlpha = mul(
        screenUV.x.remapClamp(0, 0.2, 0, 1),
        screenUV.x.remapClamp(0.8, 1, 1, 0),
        screenUV.y.remapClamp(0, 0.2, 0, 1),
        screenUV.y.remapClamp(0.8, 1, 1, 0),
      );
      const trackEdgeAlpha = uv().y.sub(0.5).abs().mul(2).oneMinus();
      const alpha = endAlpha.mul(startAlpha).mul(trackData.a).mul(trackEdgeAlpha).mul(screenEdgeAlpha);
      return vec4(vec3(...CHANNEL_COLOR[channel]), alpha);
    })();
    return material;
  }
}

export class Tracks {
  readonly game = getGame();
  readonly size = AREA_SIZE;
  readonly halfSize = AREA_SIZE / 2;
  readonly focusPoint = new THREE.Vector2();
  readonly renderTarget = new THREE.RenderTarget(RESOLUTION, RESOLUTION, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
  readonly #scene = new THREE.Scene();
  readonly #camera = new THREE.OrthographicCamera(
    -AREA_SIZE / 2,
    AREA_SIZE / 2,
    AREA_SIZE / 2,
    -AREA_SIZE / 2,
    0.1,
    10,
  );

  constructor() {
    this.#camera.position.y = CAMERA_HEIGHT;
    this.#camera.rotation.x = -Math.PI * 0.5;
    this.#scene.add(this.#camera);
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  add(track: Track): Track {
    this.#scene.add(track.mesh);
    return track;
  }

  remove(track: Track): void {
    this.#scene.remove(track.mesh);
  }

  update(): void {
    this.#camera.position.x = this.focusPoint.x;
    this.#camera.position.z = this.focusPoint.y;
    const { renderer } = this.game.rendering;
    const state = THREE.RendererUtils.resetRendererState(renderer, THREE.RendererUtils.saveRendererState(renderer));
    renderer.setPixelRatio(1);
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.#scene, this.#camera);
    renderer.setRenderTarget(null);
    THREE.RendererUtils.restoreRendererState(renderer, state);
  }
}
