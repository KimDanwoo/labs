import { uniform } from 'three/tsl';

const SURFACE_ELEVATION = -0.3;
const DEPTH_ELEVATION = -1.5;
const SURFACE_THICKNESS = 0.013;

export class Water {
  readonly surfaceElevation = SURFACE_ELEVATION;
  readonly depthElevation = DEPTH_ELEVATION;
  readonly surfaceElevationUniform = uniform(SURFACE_ELEVATION);
  readonly surfaceThicknessUniform = uniform(SURFACE_THICKNESS);
}
