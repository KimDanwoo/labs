import {
  attribute,
  cross,
  float,
  Fn,
  If,
  min,
  modelViewMatrix,
  positionGeometry,
  positionWorld,
  rotateUV,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { clamp, remapClamp } from '../utilities/maths';

type Vec2Node = THREE.Node<'vec2'>;

const SUBDIVISIONS = 256;
const ELEVATION_RANGE: [number, number] = [-1, 0.5];
const VISIBLE_ELEVATION = -0.9;
const ACCUMULATION_SPEED = 10;
const FLIP_ROTATION = Math.PI * 0.5;
const GLITTER_SPEED = { view: 0.0004, time: 0.0004 } as const;
const TICK_ORDER = 10;

function initialElevation(): number {
  const { weather } = getGame();
  const rainRatio =
    remapClamp(weather.rain.value, [0.05, 0.3], [0, 1]) * remapClamp(weather.temperature.value, [0, -5], [0, 1]);
  const meltRatio = remapClamp(weather.temperature.value, [0, 10], [0, -1]);
  return remapClamp(rainRatio + meltRatio, [-1, 1], ELEVATION_RANGE);
}

function quadGeometry(size: number, cellSize: number): THREE.BufferGeometry {
  const cells = SUBDIVISIONS * SUBDIVISIONS;
  const positions = new Float32Array(cells * 3 * 3 * 2);
  const pivots = new Float32Array(cells * 2 * 3 * 2);
  const half = cellSize * 0.5;
  const corners = [
    [half, -half],
    [-half, -half],
    [-half, half],
    [-half, half],
    [half, half],
    [half, -half],
  ] as const;

  let cell = 0;
  for (let x = 0; x < SUBDIVISIONS; x += 1) {
    for (let z = 0; z < SUBDIVISIONS; z += 1) {
      const pivotX = (x / (SUBDIVISIONS - 1) - 0.5) * (size - cellSize);
      const pivotZ = (z / (SUBDIVISIONS - 1) - 0.5) * (size - cellSize);
      for (const [corner, [offsetX, offsetZ]] of corners.entries()) {
        positions.set([pivotX + offsetX, 0, pivotZ + offsetZ], (cell * 6 + corner) * 3);
        pivots.set([pivotX, pivotZ], (cell * 6 + corner) * 2);
      }
      cell += 1;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('pivot', new THREE.BufferAttribute(pivots, 2));
  return geometry;
}

export class Snow {
  readonly #size: number;
  readonly #cellSize: number;
  readonly #roundedPosition = uniform(vec2(0));
  readonly #tracksDelta = uniform(vec2(0));
  readonly #elevation = uniform(-1);
  readonly #noiseMultiplier = uniform(1);
  readonly #noise1Frequency = uniform(0.1);
  readonly #noise2Frequency = uniform(0.07);
  readonly #waterDropEdgeLow = uniform(0.185);
  readonly #waterDropEdgeHigh = uniform(0.235);
  readonly #waterDropAmplitude = uniform(1);
  readonly #glitterVariation = uniform(0);
  readonly #elevationTarget: THREE.RenderTarget;
  readonly #elevationQuad: THREE.QuadMesh;
  readonly #mesh: THREE.Mesh;

  constructor() {
    const game = getGame();
    this.#size = game.view.optimalArea.radius * 2;
    this.#cellSize = this.#size / SUBDIVISIONS;
    this.#elevation.value = initialElevation();

    const textureSize = SUBDIVISIONS + 1;
    this.#elevationTarget = new THREE.RenderTarget(textureSize, textureSize, {
      depthBuffer: false,
      type: THREE.HalfFloatType,
      format: THREE.RedFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });
    this.#elevationQuad = new THREE.QuadMesh(this.#elevationMaterial());

    this.#mesh = new THREE.Mesh(quadGeometry(this.#size, this.#cellSize), this.#material());
    this.#mesh.castShadow = false;
    this.#mesh.receiveShadow = true;
    this.#mesh.visible = false;
    this.#mesh.frustumCulled = false;
    game.scene.add(this.#mesh);

    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  readonly #elevationNode = Fn(([position]: [Vec2Node]): THREE.Node<'float'> => {
    const { terrain, noises, tracks } = getGame();
    const elevation = this.#elevation.toVar();
    const terrainData = terrain.terrainNode(position.xy);
    const noise1 = texture(noises.perlin, position.mul(this.#noise1Frequency).xy).r;
    const noise2 = texture(noises.perlin, position.mul(this.#noise2Frequency).xy).r;
    elevation.addAssign(noise1.mul(noise2).smoothstep(0, 1).mul(this.#noiseMultiplier));

    const groundData = texture(
      tracks.renderTarget.texture,
      position.xy.sub(-tracks.halfSize).sub(this.#roundedPosition).add(this.#tracksDelta).div(tracks.size),
    );
    const wheelsTracksHeight = groundData.r.oneMinus();
    const chassisTracksHeight = groundData.g.oneMinus().remapClamp(0.5, 1, 0.25, 1);
    elevation.mulAssign(min(wheelsTracksHeight, chassisTracksHeight));
    elevation.addAssign(terrainData.b.remap(0, 1, 0, -2));
    return elevation;
  });

  #elevationMaterial(): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial({ wireframe: false });
    material.outputNode = Fn(() => {
      const position = uv()
        .sub(0.5)
        .mul(this.#size + this.#cellSize)
        .add(this.#roundedPosition);
      return vec4(this.#elevationNode(position), 0, 0, 1);
    })();
    return material;
  }

  #material(): MeshDefaultMaterial {
    const { terrain, noises } = getGame();
    const fadeEdgeHigh = uniform(0.5);
    const fadeEdgeLow = uniform(0.022);
    const normalNeighbourShift = uniform(0.2);
    const deltaY = varying(float());
    const worldUv = varying(vec2());
    const computedNormal = varying(vec3());
    const pivot = attribute('pivot', 'vec2');
    const cellSize = this.#cellSize;

    const elevationFromTexture = Fn(([position]: [Vec2Node]): THREE.Node<'float'> => {
      const elevationUv = position.sub(this.#roundedPosition).div(this.#size).add(0.5);
      const snowElevation = texture(this.#elevationTarget.texture, elevationUv).r;
      return snowElevation.sub(terrain.terrainNode(position).r.mul(2));
    });

    const material = new MeshDefaultMaterial({
      normalNode: computedNormal,
      alphaNode: deltaY.smoothstep(fadeEdgeLow, fadeEdgeHigh),
      transparent: true,
      alphaTest: 0.1,
    });
    material.positionNode = Fn(() => {
      const newPosition = positionGeometry.toVar();
      newPosition.x.addAssign(this.#roundedPosition.x);
      newPosition.z.addAssign(this.#roundedPosition.y);

      const pivotCenter = vec3(pivot.x, 0, pivot.y);
      pivotCenter.x.addAssign(this.#roundedPosition.x);
      pivotCenter.z.addAssign(this.#roundedPosition.y);

      const cornerA = pivotCenter.add(vec3(-cellSize, 0, -cellSize));
      const cornerB = pivotCenter.add(vec3(cellSize, 0, -cellSize));
      const cornerC = pivotCenter.add(vec3(cellSize, 0, cellSize));
      const cornerD = pivotCenter.add(vec3(-cellSize, 0, cellSize));

      pivotCenter.y.assign(elevationFromTexture(pivotCenter.xz));
      cornerA.y.assign(elevationFromTexture(cornerA.xz).sub(pivotCenter.y));
      cornerB.y.assign(elevationFromTexture(cornerB.xz).sub(pivotCenter.y));
      cornerC.y.assign(elevationFromTexture(cornerC.xz).sub(pivotCenter.y));
      cornerD.y.assign(elevationFromTexture(cornerD.xz).sub(pivotCenter.y));

      const acDelta = cornerA.y.sub(cornerC.y).abs();
      const bdDelta = cornerB.y.sub(cornerD.y).abs();
      const rotation = float(0);
      If(acDelta.lessThan(bdDelta), () => {
        rotation.assign(FLIP_ROTATION);
      });
      newPosition.xz.assign(rotateUV(newPosition.xz, rotation, pivotCenter.xz));

      const positionA = newPosition;
      const positionB = positionA.add(vec3(normalNeighbourShift, 0, 0));
      const positionC = positionA.add(vec3(0, 0, normalNeighbourShift.negate()));
      positionA.y.assign(elevationFromTexture(positionA.xz));
      positionB.y.assign(elevationFromTexture(positionB.xz));
      positionC.y.assign(elevationFromTexture(positionC.xz));

      const terrainData = terrain.terrainNode(positionA.xz);
      const newNormal = cross(positionA.sub(positionB), positionA.sub(positionC)).normalize();
      computedNormal.assign(modelViewMatrix.mul(vec4(newNormal, 0)));

      const waterDrop = terrainData.b.remapClamp(
        this.#waterDropEdgeLow,
        this.#waterDropEdgeHigh,
        0,
        this.#waterDropAmplitude.negate(),
      );
      positionA.y.addAssign(waterDrop);
      deltaY.assign(positionA.y.sub(terrainData.b.mul(-2)));
      worldUv.assign(positionA.xz);
      return positionA;
    })();

    const baseOutput = material.shadedOutput;
    const glitterScarcity = uniform(1000);
    const glitterIntensity = uniform(2);
    const glitterPerlinFrequency = uniform(0.05);
    const glitterHashFrequency = uniform(0.2);
    material.outputNode = Fn(() => {
      const glitter = float(0);
      const hash = texture(noises.hash, positionWorld.xz.mul(glitterHashFrequency))
        .r.mul(2)
        .add(this.#glitterVariation)
        .mod(2)
        .sub(1)
        .abs();
      glitter.addAssign(hash);
      const perlin = texture(noises.perlin, positionWorld.xz.mul(glitterPerlinFrequency)).r;
      glitter.mulAssign(perlin.remapClamp(0, 0.5, 0, 1));
      glitter.assign(glitter.pow(glitterScarcity));
      glitter.mulAssign(glitterIntensity);
      return vec4(baseOutput.rgb.add(glitter), baseOutput.a);
    })();
    return material;
  }

  update(): void {
    const { weather, dayCycles, ticker, view, tracks, rendering } = getGame();
    const accumulation = weather.snow.value * Math.max(dayCycles.progressDelta, 0) * ACCUMULATION_SPEED;
    this.#elevation.value = clamp(this.#elevation.value + accumulation, ELEVATION_RANGE[0], ELEVATION_RANGE[1]);

    if (this.#elevation.value <= VISIBLE_ELEVATION) {
      this.#mesh.visible = false;
      return;
    }
    this.#mesh.visible = true;
    this.#glitterVariation.value += ticker.deltaScaled * GLITTER_SPEED.time + view.delta.length() * GLITTER_SPEED.view;

    const rounded = this.#roundedPosition.value;
    rounded.x = Math.round(view.optimalArea.position.x / this.#cellSize) * this.#cellSize;
    rounded.y = Math.round(view.optimalArea.position.z / this.#cellSize) * this.#cellSize;
    this.#tracksDelta.value.set(rounded.x - tracks.focusPoint.x, rounded.y - tracks.focusPoint.y);

    const { renderer } = rendering;
    const state = THREE.RendererUtils.resetRendererState(renderer, THREE.RendererUtils.saveRendererState(renderer));
    renderer.setPixelRatio(1);
    renderer.setRenderTarget(this.#elevationTarget);
    this.#elevationQuad.render(renderer);
    renderer.setRenderTarget(null);
    THREE.RendererUtils.restoreRendererState(renderer, state);
  }
}
