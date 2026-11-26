import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import { type Point, WORLD_SIZE } from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { clamp01 } from './fields';
import { writeScatter } from './scatter';
import { sampleTerrain } from './surface';

const OUTPUT = path.resolve(import.meta.dirname, '../../world-overrides/terrain');
const TEXTURE_SIZE = 512;
const GRID_ROWS = 129;
const DEPTH_SCALE = 1.5;
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
if (!process.argv.includes('--terrain-only')) writeScatter();
