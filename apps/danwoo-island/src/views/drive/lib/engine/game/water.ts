import { Fn, uniform, vec2 } from 'three/tsl';
import type * as THREE from 'three/webgpu';

import { COVE, tideWeight } from '@views/drive/lib/engine/game/world/layout/tideCove';

const SURFACE_ELEVATION = -0.3;
const DEPTH_ELEVATION = -1.5;
const SURFACE_THICKNESS = 0.013;
const TIDE_SECONDS = 4;

export class Water {
  readonly surfaceElevation = SURFACE_ELEVATION;
  readonly depthElevation = DEPTH_ELEVATION;
  readonly surfaceElevationUniform = uniform(SURFACE_ELEVATION);
  readonly surfaceThicknessUniform = uniform(SURFACE_THICKNESS);
  readonly tide = uniform(0);
  #target = 0;

  get isLighthouseAccessible(): boolean {
    return this.#target === 1 && this.tide.value === 1;
  }

  readonly dropNode = Fn(([point]: [THREE.Node<'vec2'>]) => {
    const distance = point.sub(vec2(COVE.x, COVE.z)).div(vec2(COVE.rx, COVE.rz)).abs();
    return distance.x.max(distance.y).smoothstep(1, 1.2).oneMinus().mul(this.tide).mul(COVE.drop);
  });

  surfaceAt(x: number, z: number): number {
    return SURFACE_ELEVATION - COVE.drop * this.tide.value * tideWeight(x, z);
  }

  toggleTide(): void {
    this.#target = 1 - this.#target;
  }

  advance(delta: number): void {
    const remaining = this.#target - this.tide.value;
    this.tide.value += Math.sign(remaining) * Math.min(Math.abs(remaining), delta / TIDE_SECONDS);
  }
}
