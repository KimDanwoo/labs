import {
  float,
  mix,
  positionView,
  screenCoordinate,
  screenSize,
  screenUV,
  smoothstep,
  step,
  uniform,
  vec2,
} from 'three/tsl';
import type * as THREE from 'three/webgpu';

type FloatNode = THREE.Node<'float'>;

interface VehicleSight {
  readonly screen: THREE.Vector2;
  readonly depth: number;
  readonly cameraRadius: number;
}

const OPENING = { radius: 7, softStart: 0.6 } as const;
const PROP_RADIUS_RATIO = 0.6;
const HIDDEN_BELOW = 0.5;
const DITHER = { scale: 52.9829189, x: 0.06711056, y: 0.00583715 } as const;

const screen = uniform(vec2());
const depth = uniform(0);
const radius = uniform(0);

export function updateVehicleSight(sight: VehicleSight): void {
  screen.value.copy(sight.screen);
  depth.value = sight.depth;
  radius.value = OPENING.radius / sight.cameraRadius;
}

export function distanceToVehicleOnScreen(): FloatNode {
  return screenUV
    .sub(screen)
    .mul(vec2(screenSize.x.div(screenSize.y), 1))
    .length();
}

export function isInFrontOfVehicle(margin: number): FloatNode {
  return step(positionView.z.negate(), depth.add(margin));
}

export function vehicleOpening(radiusRatio: FloatNode | number): FloatNode {
  const reach = radius.mul(radiusRatio);
  const opening = smoothstep(reach.mul(OPENING.softStart), reach, distanceToVehicleOnScreen());
  const dither = screenCoordinate.x
    .mul(DITHER.x)
    .add(screenCoordinate.y.mul(DITHER.y))
    .fract()
    .mul(DITHER.scale)
    .fract();
  return step(dither, opening);
}

export function propVisibility(): FloatNode {
  return mix(float(1), vehicleOpening(PROP_RADIUS_RATIO), isInFrontOfVehicle(0));
}

export function isClearOfVehicleSight(): THREE.Node<'bool'> {
  return propVisibility().greaterThan(HIDDEN_BELOW);
}

export function discardOverVehicle(): void {
  propVisibility().lessThan(HIDDEN_BELOW).discard();
}
