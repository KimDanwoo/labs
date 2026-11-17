import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import {
  closedCurve,
  isInsideLoop,
  loopDistance,
  signedLoopDistance,
} from '../../src/views/drive/lib/engine/game/world/layout/curves';
import {
  AREA_ANCHORS,
  ISLANDS,
  type Point,
  TRACK,
  WORLD_SIZE,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';

const OUTPUT = path.resolve(import.meta.dirname, '../../world-overrides/terrain');
const TEXTURE_SIZE = 512;
const GRID_ROWS = 129;
const DEPTH_SCALE = 1.5;
const CURVE_SAMPLES = 12;
const BEACH = { inland: 2, offshore: -10 } as const;
const GRASS = { from: 5, to: 8, trackClearance: 4, padClearance: 0.5, edge: 1.5 } as const;
const PAVED = { shoulder: 2.5, edge: 1.5 } as const;
const PATCH = { frequency: 0.06, threshold: -0.45, edge: 0.2, seed: 7 } as const;

const trackLoop = closedCurve(TRACK.centerline, CURVE_SAMPLES);
const islandLoops = ISLANDS.map(({ outline }) => closedCurve(outline, CURVE_SAMPLES));

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function circuitLand(point: Point): number {
  const distance = loopDistance(point, trackLoop);
  return isInsideLoop(point, trackLoop) ? TRACK.coastMargin + distance : TRACK.coastMargin - distance;
}

function boxDistance(point: Point, from: Point, to: Point): number {
  const halfX = Math.abs(to[0] - from[0]) / 2;
  const halfZ = Math.abs(to[1] - from[1]) / 2;
  const dx = Math.abs(point[0] - (from[0] + to[0]) / 2) - halfX;
  const dz = Math.abs(point[1] - (from[1] + to[1]) / 2) - halfZ;
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
}

function landDistance(point: Point): number {
  const islands = islandLoops.map((loop) => signedLoopDistance(point, loop));
  const land = Math.max(circuitLand(point), ...islands);
  return Math.min(land, boxDistance(point, TRACK.waterJump.from, TRACK.waterJump.to));
}

function padDistance(point: Point): number {
  return Math.min(
    ...Object.values(AREA_ANCHORS).map(({ placed, footprint }) =>
      boxDistance(
        point,
        [placed[0] - footprint[0] / 2, placed[1] - footprint[1] / 2],
        [placed[0] + footprint[0] / 2, placed[1] + footprint[1] / 2],
      ),
    ),
  );
}

const HASH = { x: 0x27d4eb2d, z: 0x165667b1, mix: 0x85ebca6b, shift: 13, scale: 2 ** 32 } as const;

function hash(x: number, z: number): number {
  let value = Math.imul(x, HASH.x) ^ Math.imul(z, HASH.z) ^ PATCH.seed;
  value = Math.imul(value ^ (value >>> HASH.shift), HASH.mix);
  return ((value ^ (value >>> HASH.shift)) >>> 0) / HASH.scale;
}

function valueNoise([x, z]: Point): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const top = hash(ix, iz) + (hash(ix + 1, iz) - hash(ix, iz)) * ux;
  const bottom = hash(ix, iz + 1) + (hash(ix + 1, iz + 1) - hash(ix, iz + 1)) * ux;
  return (top + (bottom - top) * uz) * 2 - 1;
}

interface TerrainSample {
  readonly paved: number;
  readonly grass: number;
  readonly depth: number;
}

function sampleTerrain(point: Point): TerrainSample {
  const land = landDistance(point);
  const track = loopDistance(point, trackLoop) - TRACK.width / 2;
  const depth = smoothstep(BEACH.inland, BEACH.offshore, land);
  const paved = land > 0 ? smoothstep(PAVED.shoulder + PAVED.edge, PAVED.shoulder, track) : 0;
  const patch = smoothstep(
    PATCH.threshold,
    PATCH.threshold + PATCH.edge,
    valueNoise([point[0] * PATCH.frequency, point[1] * PATCH.frequency]),
  );
  const grass =
    smoothstep(GRASS.from, GRASS.to, land) *
    smoothstep(GRASS.trackClearance, GRASS.trackClearance + GRASS.edge, track) *
    smoothstep(GRASS.padClearance, GRASS.padClearance + GRASS.edge, padDistance(point)) *
    patch;
  return { paved, grass, depth };
}

const toWorld = (index: number, count: number): number => (index / (count - 1) - 0.5) * WORLD_SIZE;
const toByte = (value: number): number => Math.round(clamp01(value) * 255);

function terrainPixels(): Buffer {
  const pixels = Buffer.alloc(TEXTURE_SIZE * TEXTURE_SIZE * 4);
  for (let row = 0; row < TEXTURE_SIZE; row += 1) {
    for (let column = 0; column < TEXTURE_SIZE; column += 1) {
      const point: Point = [
        ((column + 0.5) / TEXTURE_SIZE - 0.5) * WORLD_SIZE,
        ((row + 0.5) / TEXTURE_SIZE - 0.5) * WORLD_SIZE,
      ];
      const { paved, grass, depth } = sampleTerrain(point);
      pixels.set([toByte(paved), toByte(grass), toByte(depth), 255], (row * TEXTURE_SIZE + column) * 4);
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function encodePng(pixels: Buffer, size: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.concat(
    Array.from({ length: size }, (_, row) =>
      Buffer.concat([Buffer.from([0]), pixels.subarray(row * size * 4, (row + 1) * size * 4)]),
    ),
  );
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function heightGrid(): { positions: Float32Array; indices: Uint32Array } {
  const positions = new Float32Array(GRID_ROWS * GRID_ROWS * 3);
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_ROWS; column += 1) {
      const x = toWorld(column, GRID_ROWS);
      const z = toWorld(row, GRID_ROWS);
      positions.set([x, -sampleTerrain([x, z]).depth * DEPTH_SCALE, z], (row * GRID_ROWS + column) * 3);
    }
  }
  const cells = GRID_ROWS - 1;
  const indices = new Uint32Array(cells * cells * 6);
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const a = row * GRID_ROWS + column;
      indices.set([a, a + GRID_ROWS, a + 1, a + 1, a + GRID_ROWS, a + GRID_ROWS + 1], (row * cells + column) * 6);
    }
  }
  return { positions, indices };
}

function padded(buffer: Buffer, fill: number): Buffer {
  const remainder = buffer.length % 4;
  return remainder === 0 ? buffer : Buffer.concat([buffer, Buffer.alloc(4 - remainder, fill)]);
}

function encodeGlb({ positions, indices }: { positions: Float32Array; indices: Uint32Array }): Buffer {
  const positionBytes = Buffer.from(positions.buffer);
  const indexBytes = Buffer.from(indices.buffer);
  const half = WORLD_SIZE / 2;
  let minY = 0;
  for (let index = 1; index < positions.length; index += 3) minY = Math.min(minY, positions[index] ?? 0);
  const json = {
    asset: { version: '2.0', generator: 'danwoo-island buildTerrain' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'terrain', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: positionBytes.length + indexBytes.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
      { buffer: 0, byteOffset: positionBytes.length, byteLength: indexBytes.length, target: 34963 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: 'VEC3',
        min: [-half, minY, -half],
        max: [half, 0, half],
      },
      { bufferView: 1, componentType: 5125, count: indices.length, type: 'SCALAR' },
    ],
  };
  const jsonChunk = padded(Buffer.from(JSON.stringify(json)), 0x20);
  const binChunk = padded(Buffer.concat([positionBytes, indexBytes]), 0);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const chunkHeader = (length: number, type: number): Buffer => {
    const head = Buffer.alloc(8);
    head.writeUInt32LE(length, 0);
    head.writeUInt32LE(type, 4);
    return head;
  };
  return Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, 0x4e4f534a),
    jsonChunk,
    chunkHeader(binChunk.length, 0x004e4942),
    binChunk,
  ]);
}

mkdirSync(OUTPUT, { recursive: true });
writeFileSync(path.join(OUTPUT, 'terrain.png'), encodePng(terrainPixels(), TEXTURE_SIZE));
writeFileSync(path.join(OUTPUT, 'terrain.glb'), encodeGlb(heightGrid()));
process.stdout.write(`지형을 구웠어요: ${OUTPUT}\n`);
