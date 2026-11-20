import { color, Fn, min, mix, positionLocal, positionWorld, texture, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { Physical } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

const CELL_SIZE = 1.5;
const EDGE_FADE = 20;
const MAX_SUBDIVISIONS = 320;
const DEPTH_SCALE = -1.5;
const BED_ROCK = { halfHeight: 0.5, halfWidth: 6 } as const;
const THROTTLE_ORDER = 2;

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
    const slabHighColor = uniform(color('#e8dfcc'));
    const slabLowColor = uniform(color('#a3a79e'));
    const slabTextureFrequency = uniform(0.175);
    const slabNoiseFrequency = uniform(0.03);
    const slabsTexture = game.texture('floorSlabsTexture');
    const colorNode = Fn(() => {
      const baseColor = game.terrain.colorNode(terrainData);
      const slabNoise = texture(game.noises.perlin, positionWorld.xz.mul(slabNoiseFrequency)).r;
      const slabs = texture(slabsTexture, positionWorld.xz.mul(slabTextureFrequency)).r;
      const slabColor = mix(slabLowColor, slabHighColor, slabs);
      return mix(baseColor, slabColor, terrainData.r.mul(slabNoise)).rgb;
    })();

    const material = new MeshDefaultMaterial({
      colorNode,
      normalNode: vec3(0, 1, 0),
      shadowNode: terrainData.g,
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
    const { physical } = game.objects.add(null, {
      type: 'fixed',
      friction: 0.2,
      restitution: 0.15,
      colliders: [
        {
          shape: 'heightfield',
          parameters: [rows - 1, rows - 1, heights, { x: size, y: 1, z: size }],
          category: 'floor',
        },
      ],
    });
    if (!physical) throw new Error('Floor heightfield was not created');
    return physical;
  }

  update(): void {
    const { view, player, terrain, water } = getGame();
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
