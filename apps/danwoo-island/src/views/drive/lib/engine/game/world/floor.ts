import {
  color,
  Fn,
  min,
  mix,
  positionLocal,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { Physical } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

import { COVE, hiddenCoveDepth } from '@views/drive/lib/engine/game/world/layout/tideCove';

const CELL_SIZE = 1.5;
const EDGE_FADE = 20;
const MAX_SUBDIVISIONS = 320;
const DEPTH_SCALE = -1.5;
const BED_ROCK = { halfHeight: 0.5, halfWidth: 6 } as const;
const THROTTLE_ORDER = 2;
const DECK = {
  high: '#ecd1a2',
  low: '#c29a70',
  plankWidth: 0.55,
  plankRatio: 5,
  seam: 0.05,
  toneRange: 0.2,
  rowSalt: 7.31,
  patchFrequency: 0.03,
} as const;
const HASH = { scale: 12.9898, spread: 43758.5453 } as const;

function pseudoRandom(value: THREE.Node<'float'>): THREE.Node<'float'> {
  return value.mul(HASH.scale).sin().mul(HASH.spread).fract();
}

function floorSize(): number {
  return Math.round(getGame().view.optimalArea.radius * 2) + 1;
}

function planeGeometry(size: number, subdivisions: number): THREE.PlaneGeometry {
  const segments = Math.min(subdivisions, MAX_SUBDIVISIONS);
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI * 0.5);
  geometry.deleteAttribute('normal');
  return geometry;
}

function terrainHeights(geometry: THREE.BufferGeometry): { rows: number; heights: Float32Array } {
  const position = geometry.attributes.position;
  if (!position) throw new Error('Terrain geometry has no positions');
  const total = position.count;
  const rows = Math.sqrt(total);
  const heights = new Float32Array(total);
  const extent = getGame().terrain.size;
  for (let vertex = 0; vertex < total; vertex += 1) {
    const indexX = Math.round((position.getX(vertex) / extent + 0.5) * (rows - 1));
    const indexZ = Math.round((position.getZ(vertex) / extent + 0.5) * (rows - 1));
    heights[indexZ + indexX * rows] = position.getY(vertex);
  }
  return { rows, heights };
}

export class Floor {
  readonly physical: Physical;
  readonly #mesh: THREE.Mesh;
  readonly #bedRock: Physical;
  #updateCoveBed!: (progress: number) => void;
  #isBedRockEnabled = false;

  constructor() {
    const game = getGame();
    this.#mesh = this.#createVisual();
    this.physical = this.#createHeightfield();
    this.#bedRock = game.physics.getPhysical({
      type: 'kinematicPositionBased',
      position: new THREE.Vector3(0, game.water.depthElevation - BED_ROCK.halfHeight, 0),
      frictionRule: 'min',
      friction: 0.5,
      enabled: true,
      colliders: [{ shape: 'cuboid', parameters: [BED_ROCK.halfWidth, BED_ROCK.halfHeight, BED_ROCK.halfWidth] }],
    });
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.floor);
  }

  #createVisual(): THREE.Mesh {
    const game = getGame();
    const size = floorSize();
    const terrainData = game.terrain.terrainNode(positionWorld.xz);
    const deckHighColor = uniform(color(DECK.high));
    const deckLowColor = uniform(color(DECK.low));
    const colorNode = Fn(() => {
      const baseColor = game.terrain.colorNode(terrainData);
      const deckNoise = texture(game.noises.perlin, positionWorld.xz.mul(DECK.patchFrequency)).r;
      const deck = positionWorld.xz.div(DECK.plankWidth);
      const row = deck.y.floor();
      const along = deck.x.div(DECK.plankRatio).add(pseudoRandom(row));
      const plankTone = pseudoRandom(along.floor().add(row.mul(DECK.rowSalt)));
      const acrossEdge = min(deck.y.fract(), deck.y.fract().oneMinus());
      const alongEdge = min(along.fract(), along.fract().oneMinus()).mul(DECK.plankRatio);
      const edge = min(acrossEdge, alongEdge);
      const seam = smoothstep(DECK.seam, edge.fwidth().add(DECK.seam), edge);
      const shade = seam.mul(plankTone.mul(DECK.toneRange).add(1 - DECK.toneRange));
      const deckColor = mix(deckLowColor, deckHighColor, shade);
      const surface = mix(baseColor, deckColor, terrainData.r.mul(deckNoise));
      const x = positionWorld.x;
      const alongRoad = x
        .sub(COVE.startX)
        .div(COVE.islandX - COVE.startX)
        .clamp();
      const centerZ = alongRoad.mul(Math.PI).sin().mul(-2).add(COVE.islandZ);
      const edgeDistance = positionWorld.z.sub(centerZ).abs();
      const width = edgeDistance.smoothstep(COVE.roadHalfWidth - 0.25, COVE.roadHalfWidth).oneMinus();
      const length = x
        .smoothstep(COVE.startX, COVE.startX + 1)
        .mul(x.smoothstep(COVE.islandX - 2, COVE.islandX).oneMinus());
      const stone = mix(color('#928679'), color('#beaf97'), deckNoise);
      const waterDepth = terrainData.b.mul(COVE.floorScale).add(game.water.surfaceElevationUniform);
      const exposed = game.water.dropNode(positionWorld.xz).sub(waterDepth).smoothstep(-0.12, 0.08);
      const road = mix(surface, stone, width.mul(length).mul(exposed).mul(game.water.tide));
      const shore = positionWorld.xz
        .sub(vec2(COVE.islandX, COVE.islandZ))
        .div(vec2(COVE.islandRadiusX, COVE.islandRadiusZ))
        .length();
      const grain = texture(game.noises.perlin, positionWorld.xz.mul(0.16)).r;
      const windBands = positionWorld.z
        .mul(1.7)
        .add(positionWorld.x.mul(0.39))
        .add(grain.mul(8))
        .sin()
        .smoothstep(0.38, 1);
      const powder = mix(color('#d8e5f1'), color('#f5f8fa'), grain.mul(0.6).add(windBands.mul(0.4)));
      const wheelTracks = texture(game.tracks.renderTarget.texture, game.terrain.trackUvNode(positionWorld.xz)).r;
      const snow = mix(powder, color('#c2d6e4'), wheelTracks.mul(0.65));
      const snowCover = shore.add(grain.sub(0.5).mul(0.16)).smoothstep(0.93, 1.12).oneMinus();
      return mix(road, snow, snowCover.mul(game.water.tide)).rgb;
    })();

    const material = new MeshDefaultMaterial({
      colorNode,
      normalNode: vec3(0, 1, 0),
      shadowNode: terrainData.g.mul(0.36),
      hasWater: false,
      hasLightBounce: false,
      wireframe: false,
    });
    material.positionNode = Fn(() => {
      const edgeFade = min(min(uv().x, uv().y).mul(EDGE_FADE), 1);
      const newPosition = positionLocal;
      newPosition.y.addAssign(terrainData.b.mul(DEPTH_SCALE).mul(edgeFade));
      return newPosition;
    })();

    const mesh = new THREE.Mesh(planeGeometry(size, size / CELL_SIZE), material);
    mesh.receiveShadow = true;
    game.scene.add(mesh);
    game.viewport.events.on(
      'throttleChange',
      () => {
        const resized = floorSize();
        mesh.geometry.dispose();
        mesh.geometry = planeGeometry(resized, resized);
      },
      THROTTLE_ORDER,
    );
    return mesh;
  }

  #createHeightfield(): Physical {
    const game = getGame();
    const terrainMesh = game.model('terrainModel').scene.children[0];
    if (!(terrainMesh instanceof THREE.Mesh)) throw new Error('Terrain mesh is missing');
    const { rows, heights } = terrainHeights(terrainMesh.geometry);
    const { size } = game.terrain;
    const submerged = heights.slice();
    const changed: number[] = [];
    for (const [index, height] of heights.entries()) {
      const x = (Math.floor(index / rows) / (rows - 1) - 0.5) * size;
      const z = ((index % rows) / (rows - 1) - 0.5) * size;
      const depth = hiddenCoveDepth(x, z) * DEPTH_SCALE;
      if (depth >= height) continue;
      submerged[index] = depth;
      changed.push(index);
    }
    const { physical } = game.objects.add(null, {
      type: 'fixed',
      friction: 0.2,
      restitution: 0.15,
      colliders: [
        {
          shape: 'heightfield',
          parameters: [rows - 1, rows - 1, submerged, { x: size, y: 1, z: size }],
          category: 'floor',
        },
      ],
    });
    if (!physical) throw new Error('Floor heightfield was not created');
    const collider = physical.colliders[0];
    if (!collider) throw new Error('Floor collider was not created');
    let stage = 0;
    const working = submerged.slice();
    this.#updateCoveBed = (progress) => {
      const next = Math.floor(progress * 24);
      if (next === stage) return;
      stage = next;
      for (const i of changed) {
        const bed = submerged[i] ?? 0;
        working[i] = bed + ((heights[i] ?? 0) - bed) * (next / 24);
      }
      collider.setShape(new game.RAPIER.Heightfield(rows - 1, rows - 1, working, { x: size, y: 1, z: size }));
    };
    return physical;
  }

  update(): void {
    const { view, player, terrain, water } = getGame();
    this.#updateCoveBed(water.tide.value);
    this.#mesh.position.x = Math.round(view.optimalArea.position.x / CELL_SIZE) * CELL_SIZE;
    this.#mesh.position.z = Math.round(view.optimalArea.position.z / CELL_SIZE) * CELL_SIZE;

    const edge = terrain.size / 2 - BED_ROCK.halfWidth;
    const isNearEdge = Math.abs(player.position.x) > edge || Math.abs(player.position.z) > edge;
    const { body } = this.#bedRock;
    if (!isNearEdge) {
      if (this.#isBedRockEnabled) body.setEnabled(false);
      this.#isBedRockEnabled = false;
      return;
    }
    if (!this.#isBedRockEnabled) body.setEnabled(true);
    this.#isBedRockEnabled = true;
    const y = water.depthElevation - BED_ROCK.halfHeight;
    body.setNextKinematicTranslation({ x: Math.round(player.position.x), y, z: Math.round(player.position.z) });
    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
  }
}
