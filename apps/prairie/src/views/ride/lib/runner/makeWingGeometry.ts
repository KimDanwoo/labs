import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three';

const RINGS = 8;
const SIDES = 6;
const LAYERS = 3;
const FEATHER_SHARE = 0.6;
const GOLD_START = 0.88;
const GOLD_SPAN = 0.12;
const PEARL = new Color('#f1eadc');
const SHADOW = new Color('#9eafc4');
const GOLD = new Color('#d8bd82');

interface FeatherSpine {
  root: Vector3;
  tip: Vector3;
}

function spineOf(layer: number, fan: number, span: number): FeatherSpine {
  if (layer === 1) {
    return {
      root: new Vector3(0.2 + (1 - fan) * 1.2, 0.055, -0.12),
      tip: new Vector3(span * 0.57 * (1 - fan * 0.82), -0.13, -2.15 + fan * 0.65),
    };
  }
  if (layer === 2) {
    return {
      root: new Vector3(0.12 + (1 - fan) * 0.8, 0.14, 0),
      tip: new Vector3(span * 0.64 * (1 - fan * 0.85), 0.1, -0.85 + fan * 0.15),
    };
  }
  return {
    root: new Vector3(0.9 + (1 - fan) * 1.2, 0, -0.1 - fan * 0.35),
    tip: new Vector3(span * (1 - fan * 0.43), -0.08, -0.25 - fan * 2.1),
  };
}

interface Buffers {
  positions: number[];
  indices: number[];
  uvs: number[];
  colors: number[];
}

function pushRing(
  buffers: Buffers,
  center: Vector3,
  across: Vector3,
  width: number,
  shade: { layer: number; t: number },
): void {
  const tint = new Color();
  for (let side = 0; side < SIDES; side += 1) {
    const angle = (side / SIDES) * Math.PI * 2;
    buffers.positions.push(
      center.x + across.x * Math.cos(angle) * width,
      center.y + Math.sin(angle) * width * 0.18,
      center.z + across.z * Math.cos(angle) * width,
    );
    buffers.uvs.push((Math.cos(angle) + 1) * 0.5, shade.t);
    tint.copy(SHADOW).lerp(PEARL, 0.35 + shade.layer * 0.13 + shade.t * 0.3);
    tint.lerp(GOLD, Math.max(0, (shade.t - GOLD_START) / GOLD_SPAN) * (shade.layer === 0 ? 0.3 : 0.12));
    buffers.colors.push(tint.r, tint.g, tint.b);
  }
}

function pushFeather(buffers: Buffers, spine: FeatherSpine, layer: number, feather: number): void {
  const { root, tip } = spine;
  const across = new Vector3(-(tip.z - root.z), 0, tip.x - root.x).normalize();
  const offset = buffers.positions.length / 3;
  for (let ring = 0; ring <= RINGS; ring += 1) {
    const t = ring / RINGS;
    const width = (layer === 2 ? 0.15 : 0.2) * Math.pow(Math.sin(Math.PI * t), 0.65) + 0.001;
    const center = root.clone().lerp(tip, t);
    center.y += Math.sin(t * Math.PI) * 0.18 + feather * 0.008;
    pushRing(buffers, center, across, width, { layer, t });
  }
  for (let ring = 0; ring < RINGS; ring += 1) {
    for (let side = 0; side < SIDES; side += 1) {
      const a = offset + ring * SIDES + side;
      const b = offset + ring * SIDES + ((side + 1) % SIDES);
      buffers.indices.push(a, a + SIDES, b, b, a + SIDES, b + SIDES);
    }
  }
}

export function makeWingGeometry(span: number, feathers: number): BufferGeometry {
  const buffers: Buffers = { positions: [], indices: [], uvs: [], colors: [] };
  const count = Math.ceil(feathers * FEATHER_SHARE);
  for (let layer = 0; layer < LAYERS; layer += 1) {
    for (let feather = 0; feather < count; feather += 1) {
      pushFeather(buffers, spineOf(layer, feather / (count - 1), span), layer, feather);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(buffers.positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(buffers.uvs, 2));
  geometry.setAttribute('color', new Float32BufferAttribute(buffers.colors, 3));
  geometry.setIndex(buffers.indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
