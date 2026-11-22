import { gradientColor } from '@views/drive/lib/engine/game/materials';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { PartName, VehicleParts } from '@views/drive/lib/engine/game/world/boxyVehicle';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

const HALF_TURN = Math.PI / 2;
const WHEEL_AXLES = [-0.9, 0.9] as const;
const SIDES = [-1, 1] as const;
const ROUND_SEGMENTS = 24;
const PAINT_UV = { offsetX: 1.6, width: 3.2, top: 0.76, height: 1.4 } as const;
const WHEEL_GUARD = /^wheelGuard/;
const WHEEL_CONTAINER = /^wheelContainer/;
export function shadedMaterial(shade: string): MeshDefaultMaterial {
  const material = new MeshDefaultMaterial({ colorNode: gradientColor(shade, shade) });
  material.userData.prevent = true;
  return material;
}
function paintUv(geometry: THREE.BufferGeometry): void {
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (!positions) return;
  if (!uv) return;
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(
      index,
      (positions.getX(index) + PAINT_UV.offsetX) / PAINT_UV.width,
      (PAINT_UV.top - positions.getY(index)) / PAINT_UV.height,
    );
  }
  geometry.setAttribute('uv1', uv.clone());
}
export function createPartsBuilder(): VehicleParts {
  const batches = new Map<PartName, THREE.BufferGeometry[]>();
  const add: VehicleParts['add'] = (name, geometry, position, rotation = [0, 0, 0]) => {
    geometry.rotateX(rotation[0]);
    geometry.rotateY(rotation[1]);
    geometry.rotateZ(rotation[2]);
    geometry.translate(...position);
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    const batch = batches.get(name) ?? [];
    batch.push(part);
    batches.set(name, batch);
  };
  const box: VehicleParts['box'] = (name, size, position, options = {}) => {
    const geometry = options.radius
      ? new RoundedBoxGeometry(...size, 1, options.radius)
      : new THREE.BoxGeometry(...size);
    add(name, geometry, position, options.rotation);
  };
  const cylinder: VehicleParts['cylinder'] = (name, radius, depth, position) =>
    add(name, new THREE.CylinderGeometry(radius, radius, depth, ROUND_SEGMENTS), position, [0, 0, HALF_TURN]);
  const ring: VehicleParts['ring'] = (name, radius, tube, position) =>
    add(name, new THREE.TorusGeometry(radius, tube, 6, ROUND_SEGMENTS), position, [0, HALF_TURN, 0]);
  const build: VehicleParts['build'] = (materials) => {
    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    for (const [name, geometries] of batches) {
      const geometry = mergeGeometries(geometries);
      for (const part of geometries) part.dispose();
      if (!geometry) throw new Error(`차량 부품을 합치지 못했습니다: ${name}`);
      if (name === 'bodyPainted') paintUv(geometry);
      const mesh = new THREE.Mesh(geometry, materials[name]);
      mesh.name = name;
      chassis.add(mesh);
    }
    return chassis;
  };
  return { add, box, cylinder, ring, build };
}
export function addCabin(parts: VehicleParts): void {
  const outline = new THREE.Shape([
    new THREE.Vector2(-1.24, 0.08),
    new THREE.Vector2(0.45, 0.08),
    new THREE.Vector2(0.34, 0.67),
    new THREE.Vector2(-1.24, 0.67),
  ]);
  const cabin = new THREE.ExtrudeGeometry(outline, {
    depth: 1.32,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  parts.add('bodyPainted', cabin, [0, 0, -0.66]);
  parts.box('cream', [1.77, 0.09, 1.43], [-0.45, 0.715, 0], { radius: 0.025 });
  parts.box('bodyPainted', [1.01, 0.16, 1.37], [0.89, 0.12, 0], { radius: 0.025 });
  parts.box('trim', [0.94, 0.018, 1.25], [0.91, 0.025, 0]);
  parts.box('glass', [0.025, 0.43, 1.15], [0.409, 0.394, 0], { radius: 0.01, rotation: [0, 0, 0.184] });
  parts.box('glass', [0.022, 0.4, 1.12], [-1.265, 0.392, 0], { radius: 0.015 });
  for (const side of SIDES) {
    parts.box('glass', [0.43, 0.4, 0.022], [0.085, 0.395, side * 0.682], { radius: 0.025 });
    parts.box('glass', [0.48, 0.4, 0.022], [-0.455, 0.395, side * 0.682], { radius: 0.02 });
    parts.box('glass', [0.35, 0.4, 0.022], [-0.96, 0.395, side * 0.682], { radius: 0.02 });
    parts.box('cream', [1.66, 0.033, 0.026], [-0.43, 0.157, side * 0.701]);
    parts.box('cream', [1.65, 0.024, 0.027], [-0.43, 0.656, side * 0.706]);
    parts.box('trim', [0.024, 0.54, 0.023], [-0.17, -0.06, side * 0.706]);
    for (const x of [-0.62, -0.07]) parts.box('trim', [0.14, 0.038, 0.043], [x, 0.07, side * 0.72], { radius: 0.008 });
    for (const x of [-0.76, 0.25]) {
      parts.box('metal', [0.065, 0.032, 0.042], [x, 0.04, side * 0.72]);
      parts.box('metal', [0.065, 0.032, 0.042], [x, -0.22, side * 0.72]);
    }
    parts.box('trim', [0.1, 0.036, 0.15], [0.3, 0.25, side * 0.76]);
    parts.box('bodyPainted', [0.18, 0.13, 0.105], [0.29, 0.29, side * 0.865], { radius: 0.022 });
    parts.box('glass', [0.015, 0.09, 0.08], [0.192, 0.295, side * 0.865]);
    parts.box('cream', [1.0, 0.09, 0.15], [-0.05, -0.47, side * 0.77], { radius: 0.015 });
    parts.box('metal', [0.93, 0.018, 0.12], [-0.05, -0.42, side * 0.78]);
    parts.box('cream', [2.55, 0.055, 0.012], [0.02, -0.01, side * 0.703]);
  }
  for (const z of [-0.3, 0.3]) parts.box('trim', [0.02, 0.02, 0.34], [0.45, 0.2, z], { rotation: [0.07, 0, 0] });
}
export function addFenders(parts: VehicleParts): void {
  for (const axle of WHEEL_AXLES) {
    const shape = new THREE.Shape();
    const radius = 0.52;
    const innerRadius = 0.445;
    const centerY = -0.61;
    shape.moveTo(-radius, centerY - 0.025);
    shape.lineTo(-radius, centerY);
    for (let step = 0; step <= 8; step++) {
      const angle = Math.PI - (step / 8) * Math.PI;
      shape.lineTo(Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    }
    shape.lineTo(radius, centerY - 0.025);
    shape.lineTo(innerRadius, centerY - 0.025);
    for (let step = 0; step <= 8; step++) {
      const angle = (step / 8) * Math.PI;
      shape.lineTo(Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius);
    }
    shape.lineTo(-innerRadius, centerY - 0.025);
    shape.closePath();
    for (const side of SIDES) {
      const arch = new THREE.ExtrudeGeometry(shape, {
        depth: 0.17,
        steps: 1,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.01,
        bevelSegments: 1,
      });
      parts.add('bodyPainted', arch, [axle, 0, side > 0 ? 0.68 : -0.85]);
    }
  }
}
export function addFront(parts: VehicleParts): void {
  parts.box('bodyPainted', [0.14, 0.37, 1.38], [1.35, -0.07, 0], { radius: 0.02 });
  parts.box('trim', [0.03, 0.29, 0.64], [1.429, -0.06, 0], { radius: 0.02 });
  for (const y of [-0.15, -0.06, 0.03]) parts.box('metal', [0.025, 0.026, 0.57], [1.454, y, 0]);
  parts.cylinder('metal', 0.065, 0.03, [1.47, -0.06, 0]);
  parts.cylinder('trim', 0.043, 0.012, [1.49, -0.06, 0]);
  for (const side of SIDES) {
    parts.cylinder('trim', 0.177, 0.05, [1.432, -0.055, side * 0.51]);
    parts.ring('metal', 0.145, 0.013, [1.462, -0.055, side * 0.51]);
    parts.cylinder('headlights', 0.123, 0.012, [1.47, -0.055, side * 0.51]);
    parts.box('trim', [0.15, 0.065, 0.13], [0.91, 0.245, side * 0.61], { radius: 0.012 });
    parts.box('amber', [0.115, 0.043, 0.105], [0.91, 0.278, side * 0.61], { radius: 0.01 });
    const blinker = side < 0 ? 'blinkerLeft' : 'blinkerRight';
    parts.box(blinker, [0.12, 0.047, 0.11], [0.91, 0.28, side * 0.61], { radius: 0.01 });
  }
  parts.box('cream', [0.17, 0.19, 1.62], [1.44, -0.34, 0], { radius: 0.025 });
  parts.box('metal', [0.035, 0.095, 0.71], [1.531, -0.37, 0], { radius: 0.012 });
  parts.box('trim', [0.02, 0.09, 0.3], [1.553, -0.31, 0]);
}
export function addRear(parts: VehicleParts): void {
  parts.box('cream', [0.16, 0.17, 1.57], [-1.29, -0.35, 0], { radius: 0.022 });
  parts.box('trim', [0.045, 0.42, 0.08], [-1.28, 0.0, -0.45]);
  parts.box('metal', [0.04, 0.035, 0.13], [-1.295, 0.11, -0.46]);
  parts.cylinder('trim', 0.37, 0.19, [-1.38, 0.11, 0.02]);
  parts.ring('metal', 0.335, 0.016, [-1.485, 0.11, 0.02]);
  parts.cylinder('board', 0.31, 0.018, [-1.49, 0.11, 0.02]);
  parts.cylinder('cream', 0.13, 0.012, [-1.505, 0.11, 0.02]);
  for (const side of SIDES) {
    parts.box('trim', [0.045, 0.13, 0.29], [-1.29, -0.17, side * 0.53], { radius: 0.014 });
    parts.box('redLens', [0.015, 0.086, 0.19], [-1.318, -0.17, side * 0.56], { radius: 0.009 });
    parts.box('stopLights', [0.018, 0.086, 0.19], [-1.32, -0.17, side * 0.56], { radius: 0.009 });
    parts.box('backLights', [0.019, 0.07, 0.055], [-1.32, -0.17, side * 0.435]);
  }
}
export function wheelAssembly(original: THREE.Object3D): THREE.Object3D {
  const source =
    original.getObjectByName('wheelContainer') ?? original.children.find((child) => WHEEL_CONTAINER.test(child.name));
  if (!source) throw new Error('차량 바퀴 연결 모델이 없습니다.');
  const wheels = source.clone(true);
  wheels.name = 'wheelContainer';
  for (const child of [...wheels.children]) {
    if (WHEEL_GUARD.test(child.name)) wheels.remove(child);
  }
  return wheels;
}
const RACK = { bars: [-1.0, 0.1], barY: 0.8, footY: 0.775, rail: 0.62 } as const;
const BOARD = { length: 1.05, tail: 0.16, belly: 0.29, thickness: 0.05, bevel: 0.02, x: -0.42, y: 0.85 } as const;
function surfboardGeometry(): THREE.ExtrudeGeometry {
  const { length, tail, belly } = BOARD;
  const outline = new THREE.Shape();
  outline.moveTo(-length, -tail);
  outline.bezierCurveTo(-length / 2, -belly, length / 2, -belly, length, 0);
  outline.bezierCurveTo(length / 2, belly, -length / 2, belly, -length, tail);
  outline.quadraticCurveTo(-length - 0.04, 0, -length, -tail);
  return new THREE.ExtrudeGeometry(outline, {
    depth: BOARD.thickness,
    curveSegments: 14,
    bevelEnabled: true,
    bevelThickness: BOARD.bevel,
    bevelSize: BOARD.bevel,
    bevelSegments: 2,
  });
}
export function addSurfRack(parts: VehicleParts): void {
  for (const x of RACK.bars) {
    parts.box('trim', [0.06, 0.045, 1.42], [x, RACK.barY, 0], { radius: 0.012 });
    for (const side of SIDES) parts.box('trim', [0.09, 0.05, 0.07], [x, RACK.footY, side * RACK.rail]);
    parts.box('trim', [0.07, 0.014, 0.6], [x, BOARD.y + BOARD.thickness + BOARD.bevel + 0.006, 0]);
  }
  parts.add('board', surfboardGeometry(), [BOARD.x, BOARD.y, 0], [-HALF_TURN, 0, 0]);
  parts.box('cream', [1.6, 0.008, 0.045], [BOARD.x + 0.05, BOARD.y + BOARD.thickness + BOARD.bevel, 0]);
}
