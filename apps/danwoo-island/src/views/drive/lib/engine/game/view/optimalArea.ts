import * as THREE from 'three/webgpu';

export interface QuadPoint {
  base: THREE.Vector2;
  offseted: THREE.Vector2;
}

interface FloorCorner {
  ndc: THREE.Vector2;
  quadIndex: number;
}

const QUAD_DIAGONALS: readonly [FloorCorner, FloorCorner][] = [
  [
    { ndc: new THREE.Vector2(1, -1), quadIndex: 0 },
    { ndc: new THREE.Vector2(-1, 1), quadIndex: 2 },
  ],
  [
    { ndc: new THREE.Vector2(-1, -1), quadIndex: 3 },
    { ndc: new THREE.Vector2(1, 1), quadIndex: 1 },
  ],
];
const NEAR_EDGE = new THREE.Vector2(0, -1);
const FAR_EDGE = new THREE.Vector2(0, 1);
const QUAD_CORNERS = 4;

export class OptimalArea {
  needsUpdate = true;
  readonly position = new THREE.Vector3();
  basePosition = new THREE.Vector3();
  nearDistance = 0;
  farDistance = 0;
  radius = 0;
  readonly quad2: QuadPoint[] = Array.from({ length: QUAD_CORNERS }, () => ({
    base: new THREE.Vector2(),
    offseted: new THREE.Vector2(),
  }));
  readonly #raycaster = new THREE.Raycaster();
  readonly #floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  measure(camera: THREE.Camera): void {
    const centers = QUAD_DIAGONALS.map(([near, far]) => {
      const nearPoint = this.#floorPoint(camera, near);
      const farPoint = this.#floorPoint(camera, far);
      return { center: nearPoint.clone().lerp(farPoint, 0.5), farPoint };
    });
    const [first, second] = centers;
    if (!first || !second) return;
    this.basePosition = first.center.clone().lerp(second.center, 0.5);
    this.radius = this.basePosition.distanceTo(second.farPoint);
    this.nearDistance = camera.position.distanceTo(this.#intersect(camera, NEAR_EDGE));
    this.farDistance = camera.position.distanceTo(this.#intersect(camera, FAR_EDGE));
    this.needsUpdate = false;
  }

  follow(focus: THREE.Vector3, smoothedFocus: THREE.Vector3): void {
    this.position.copy(this.basePosition).add(new THREE.Vector3(smoothedFocus.x, 0, smoothedFocus.z));
    for (const point of this.quad2) point.offseted.set(point.base.x + focus.x, point.base.y + focus.z);
  }

  #floorPoint(camera: THREE.Camera, { ndc, quadIndex }: FloorCorner): THREE.Vector3 {
    const point = this.#intersect(camera, ndc);
    this.quad2[quadIndex]?.base.set(point.x, point.z);
    return point;
  }

  #intersect(camera: THREE.Camera, ndc: THREE.Vector2): THREE.Vector3 {
    const point = new THREE.Vector3();
    this.#raycaster.setFromCamera(ndc, camera);
    this.#raycaster.ray.intersectPlane(this.#floor, point);
    return point;
  }
}
