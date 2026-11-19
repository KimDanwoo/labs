import * as THREE from 'three';

export function createPartKit() {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const plane = new THREE.PlaneGeometry(1, 1);
  const circle = new THREE.CircleGeometry(1, 24);
  const triangle = new THREE.CircleGeometry(1, 3);
  geometries.push(plane, circle, triangle);
  function part(
    group: THREE.Group,
    shape: THREE.BufferGeometry,
    color: number,
    x: number,
    y: number,
    w: number,
    h: number,
    order = 3.6,
    opacity = 1,
  ) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(shape, material);
    mesh.position.set(x, y, 0);
    mesh.scale.set(w, h, 1);
    mesh.renderOrder = order;
    group.add(mesh);
    return mesh;
  }
  function createHeartGeometry() {
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.6);
    heartShape.bezierCurveTo(-1.2, 0.2, -0.7, 1.1, 0, 0.5);
    heartShape.bezierCurveTo(0.7, 1.1, 1.2, 0.2, 0, -0.6);
    const heartGeometry = new THREE.ShapeGeometry(heartShape);
    geometries.push(heartGeometry);
    return heartGeometry;
  }
  return {
    plane,
    circle,
    triangle,
    part,
    createHeartGeometry,
    track: (geometry: THREE.BufferGeometry) => geometries.push(geometry),
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

export type PartKit = ReturnType<typeof createPartKit>;
