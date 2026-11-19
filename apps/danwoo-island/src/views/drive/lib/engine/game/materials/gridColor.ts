import { clamp, Fn, If, mix, normalWorld, smoothstep, step, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

type FloatNode = THREE.Node<'float'>;
type Vec2Node = THREE.Node<'vec2'>;
type ColorNode = THREE.Node<'vec3'> | THREE.Node<'color'>;

interface GridLine {
  color: THREE.ColorRepresentation;
  scale: number;
  thickness: number;
  cross: number;
}

interface GridColorOptions {
  color: THREE.ColorRepresentation;
  scale: number;
  lines: readonly GridLine[];
}

interface GridParams {
  position: Vec2Node;
  scale: FloatNode;
  thickness: FloatNode;
  offset: Vec2Node;
  cross: FloatNode;
  derivativeMask: FloatNode;
}

const LINE_ANTIALIAS = 1.5;

const dominantAxis = Fn(([normal]: [THREE.Node<'vec3'>]): THREE.Node<'vec3'> => {
  const axisX = vec3(1, 0, 0);
  const axisY = vec3(0, 1, 0);
  const axisZ = vec3(0, 0, 1);
  const dotX = normal.dot(axisX).abs();
  const dotY = normal.dot(axisY).abs();
  const dotZ = normal.dot(axisZ).abs();
  const mask = axisX;
  If(dotZ.greaterThan(dotX), () => {
    mask.assign(axisZ);
  });
  If(dotY.greaterThan(dotX).and(dotY.greaterThan(dotZ)), () => {
    mask.assign(axisY);
  });
  return mask;
});

const antialiasedGrid = Fn(
  ([position, scale, thickness, offset, cross, derivativeMask]: [
    Vec2Node,
    FloatNode,
    FloatNode,
    Vec2Node,
    FloatNode,
    FloatNode,
  ]): FloatNode => {
    const reference = position.div(scale).add(offset);
    const derivative = reference.fwidth().mul(derivativeMask);
    const drawWidth = clamp(thickness, derivative, 1);
    const antialias = derivative.mul(LINE_ANTIALIAS);

    const crossGrid = step(reference.fract().sub(0.5).abs(), cross.oneMinus().mul(0.5));
    const crossMask = mix(crossGrid.x, 1, crossGrid.y).oneMinus();

    const gridUv = reference.fract().mul(2).sub(1).abs().oneMinus();
    const sharp = smoothstep(drawWidth.add(antialias), drawWidth.sub(antialias), gridUv).mul(
      clamp(thickness.div(drawWidth), 0, 1),
    );
    const grid = mix(sharp, thickness, clamp(derivative.mul(2).sub(1), 0, 1)).mul(crossMask);
    return mix(grid.x, 1, grid.y);
  },
);

function gridNode({ position, scale, thickness, offset, cross, derivativeMask }: GridParams): FloatNode {
  return antialiasedGrid(position, scale, thickness, offset, cross, derivativeMask);
}

export function gridColorNode({ color, scale, lines }: GridColorOptions): ColorNode {
  const scaleUniform = uniform(scale);
  const derivativeMask = dominantAxis(normalWorld).fwidth().length().oneMinus().clamp(0, 1);
  const offset = uniform(new THREE.Vector2());
  let gridColor: ColorNode = uniform(new THREE.Color(color));
  for (const line of lines) {
    const grid = gridNode({
      position: uv(),
      scale: uniform(line.scale).mul(scaleUniform),
      thickness: uniform(line.thickness),
      offset,
      cross: uniform(line.cross),
      derivativeMask,
    });
    gridColor = mix(gridColor, uniform(new THREE.Color(line.color)), grid);
  }
  return gridColor;
}
