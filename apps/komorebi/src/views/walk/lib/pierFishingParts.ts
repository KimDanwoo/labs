import * as THREE from 'three';

export function createPierFishingParts(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'pier-fishing';
  group.visible = false;
  scene.add(group);
  const rodMaterial = new THREE.MeshBasicMaterial({ color: 0x725136, depthTest: false });
  const floatMaterial = new THREE.MeshBasicMaterial({ color: 0xe1784c, depthTest: false });
  const paleMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4cf, depthTest: false });
  const fishMaterial = new THREE.MeshBasicMaterial({ color: 0xa3cfcb, depthTest: false, side: THREE.DoubleSide });
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xf4efda,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  });
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4efda,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const cylinder = new THREE.CylinderGeometry(0.065, 0.09, 1, 6);
  const rods = Array.from({ length: 12 }, () => {
    const rod = new THREE.Mesh(cylinder, rodMaterial);
    rod.renderOrder = 6;
    group.add(rod);
    return rod;
  });
  const lineGeometry = new THREE.BufferGeometry();
  const linePoints = new Float32Array(25 * 3);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.frustumCulled = false;
  line.renderOrder = 6;
  group.add(line);
  const floatGeometry = new THREE.SphereGeometry(0.25, 10, 8);
  const bobber = new THREE.Mesh(floatGeometry, floatMaterial);
  bobber.renderOrder = 7;
  const floatTop = new THREE.Mesh(floatGeometry, paleMaterial);
  floatTop.scale.set(0.5, 1.3, 0.5);
  floatTop.position.y = 0.25;
  bobber.add(floatTop);
  group.add(bobber);
  const ringGeometry = new THREE.RingGeometry(0.7, 0.78, 32);
  const ripple = new THREE.Mesh(ringGeometry, ringMaterial);
  ripple.renderOrder = 6;
  group.add(ripple);
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.75);
  heartShape.bezierCurveTo(-0.25, -0.4, -1, 0.05, -0.85, 0.55);
  heartShape.bezierCurveTo(-0.7, 1, -0.15, 0.95, 0, 0.5);
  heartShape.bezierCurveTo(0.15, 0.95, 0.7, 1, 0.85, 0.55);
  heartShape.bezierCurveTo(1, 0.05, 0.25, -0.4, 0, -0.75);
  const heartGeometry = new THREE.ShapeGeometry(heartShape);
  const starGeometry = new THREE.CircleGeometry(0.35, 4);
  const heartMaterials = Array.from(
    { length: 7 },
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xf197ad,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
  );
  const hearts = heartMaterials.map((material, index) => {
    const heart = new THREE.Mesh(heartGeometry, material);
    heart.name = `catch-heart-${index}`;
    heart.renderOrder = 9;
    group.add(heart);
    return heart;
  });
  const starMaterials = Array.from(
    { length: 6 },
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffd878,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
  );
  const stars = starMaterials.map((material) => {
    const star = new THREE.Mesh(starGeometry, material);
    star.renderOrder = 9;
    group.add(star);
    return star;
  });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x30464b, depthTest: false });
  const fishGeometry = new THREE.CircleGeometry(0.6, 24);
  const fish = new THREE.Mesh(fishGeometry, fishMaterial);
  fish.name = 'caught-fish';
  fish.scale.set(0.65, 1.4, 1);
  fish.renderOrder = 7;
  const tailGeometry = new THREE.CircleGeometry(0.45, 3);
  const tail = new THREE.Mesh(tailGeometry, fishMaterial);
  tail.position.y = -0.9;
  fish.add(tail);
  const eye = new THREE.Mesh(floatGeometry, eyeMaterial);
  eye.position.set(0.22, 0.3, 0.1);
  eye.scale.setScalar(0.35);
  eye.renderOrder = 8;
  fish.add(eye);
  const fin = new THREE.Mesh(tailGeometry, paleMaterial);
  fin.position.set(-0.1, 0, 0.05);
  fin.scale.setScalar(0.6);
  fin.rotation.z = -Math.PI / 2;
  fin.renderOrder = 8;
  fish.add(fin);
  group.add(fish);
  const reel = new THREE.Mesh(floatGeometry, rodMaterial);
  reel.scale.setScalar(1.2);
  reel.renderOrder = 7;
  group.add(reel);

  const dispose = () => {
    scene.remove(group);
    [
      cylinder,
      lineGeometry,
      floatGeometry,
      ringGeometry,
      fishGeometry,
      tailGeometry,
      heartGeometry,
      starGeometry,
    ].forEach((geometry) => geometry.dispose());
    [
      rodMaterial,
      floatMaterial,
      paleMaterial,
      fishMaterial,
      lineMaterial,
      ringMaterial,
      eyeMaterial,
      ...heartMaterials,
      ...starMaterials,
    ].forEach((material) => material.dispose());
  };

  return {
    group,
    rods,
    line,
    lineGeometry,
    linePoints,
    bobber,
    ripple,
    ringMaterial,
    hearts,
    stars,
    fish,
    fishMaterial,
    reel,
    dispose,
  };
}

export type PierFishingParts = ReturnType<typeof createPierFishingParts>;
