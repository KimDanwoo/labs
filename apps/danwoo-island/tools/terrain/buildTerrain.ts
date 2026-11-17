import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import {
  closedCurve,
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
const BEACH = { inland: 1.5, offshore: -4 } as const;
const GRASS = { coast: 2, trackClearance: 3, padClearance: 0, edge: 1.5 } as const;
const PAVED = { shoulder: 2.5, edge: 1.5 } as const;
const GRASS_MASK = readGrayscale(path.resolve(import.meta.dirname, 'grassMask.pgm'));

const trackLoop = closedCurve(TRACK.centerline, CURVE_SAMPLES);
const islandLoops = ISLANDS.map(({ outline }) => outline);

interface Grayscale {
  readonly size: number;
  readonly values: Uint8Array;
}

function readGrayscale(file: string): Grayscale {
  const bytes = readFileSync(file);
  const header = bytes.subarray(0, 32).toString('ascii').split(/\s+/);
  const size = Number(header[1]);
  const offset = bytes.length - size * size;
  return { size, values: new Uint8Array(bytes.subarray(offset)) };
}

function sampleMask({ size, values }: Grayscale, [x, z]: Point): number {
  const u = Math.min(size - 1, Math.max(0, (x / WORLD_SIZE + 0.5) * size - 0.5));
  const v = Math.min(size - 1, Math.max(0, (z / WORLD_SIZE + 0.5) * size - 0.5));
  const x0 = Math.floor(u);
  const z0 = Math.floor(v);
  const x1 = Math.min(size - 1, x0 + 1);
  const z1 = Math.min(size - 1, z0 + 1);
  const at = (column: number, row: number): number => (values[row * size + column] ?? 0) / 255;
  const top = at(x0, z0) + (at(x1, z0) - at(x0, z0)) * (u - x0);
  const bottom = at(x0, z1) + (at(x1, z1) - at(x0, z1)) * (u - x0);
  return top + (bottom - top) * (v - z0);
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function boxDistance(point: Point, from: Point, to: Point): number {
  const halfX = Math.abs(to[0] - from[0]) / 2;
  const halfZ = Math.abs(to[1] - from[1]) / 2;
  const dx = Math.abs(point[0] - (from[0] + to[0]) / 2) - halfX;
  const dz = Math.abs(point[1] - (from[1] + to[1]) / 2) - halfZ;
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
}

function landDistance(point: Point): number {
  const islands = islandLoops.map((loop) => signedLoopDistance(point, loop));
  const land = Math.max(...islands);
  return Math.min(land, boxDistance(point, TRACK.waterJump.from, TRACK.waterJump.to));
}

function padDistance(point: Point): number {
  return Math.min(
    ...Object.values(AREA_ANCHORS).map(({ placed, footprint, rotation = 0 }) => {
      const cos = Math.abs(Math.cos(rotation));
      const sin = Math.abs(Math.sin(rotation));
      const halfX = (cos * footprint[0] + sin * footprint[1]) / 2;
      const halfZ = (sin * footprint[0] + cos * footprint[1]) / 2;
      return boxDistance(point, [placed[0] - halfX, placed[1] - halfZ], [placed[0] + halfX, placed[1] + halfZ]);
    }),
  );
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
  const grass =
    sampleMask(GRASS_MASK, point) *
    smoothstep(GRASS.coast, GRASS.coast + GRASS.edge, land) *
    smoothstep(GRASS.trackClearance, GRASS.trackClearance + GRASS.edge, track) *
    smoothstep(GRASS.padClearance, GRASS.padClearance + GRASS.edge, padDistance(point));
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
