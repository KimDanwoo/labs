import * as THREE from 'three';
import { catchCelebration, catchHeart } from './catchCelebration';
import { CAST_SECONDS, FISH, FISHING_PHASE, FISH_RARITY, FISH_SHAPE, isRareFish, type FishingFrame } from './fishing';

export function createPierFishing(scene: THREE.Scene) {
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

  return {
    update(age: number, frame: FishingFrame | null, origin: THREE.Vector3, size: number, reducedMotion: boolean) {
      group.visible = frame !== null;
      if (!frame) return;
      const phase = frame.phase;
      const celebration = catchCelebration(age, reducedMotion);
      const species = FISH.find((item) => item.id === frame.caught?.id);
      const isLegendary = species?.rarity === FISH_RARITY.legendary;
      const isRare = species ? isRareFish(species.id) : false;
      group.position.copy(origin);
      group.scale.setScalar(size);
      const casting = phase === FISHING_PHASE.casting;
      const fighting = phase === FISHING_PHASE.fighting;
      const caught = phase === FISHING_PHASE.caught;
      const missed = phase === FISHING_PHASE.missed;
      const bite = phase === FISHING_PHASE.bite;
      const cast = Math.min(1, age / CAST_SECONDS);
      const hook = fighting ? Math.max(0, 1 - age / 0.4) : 0;
      const angle = casting ? 2.5 - Math.sin((cast * Math.PI) / 2) * 2.05 : 0.45 + hook * 0.9 + (caught ? 0.7 : 0);
      const grip = new THREE.Vector3(1.8, 4.5, 0.2);
      const bend = fighting
        ? (frame.tension / 100) * 3.5 + (frame.isSurging && !reducedMotion ? Math.sin(age * 22) * 0.35 : 0)
        : 0.3;
      const tip = new THREE.Vector3();
      let previous = grip.clone();
      for (let i = 0; i < rods.length; i++) {
        const t = (i + 1) / rods.length;
        const next = new THREE.Vector3(
          grip.x + Math.cos(angle) * 12 * t,
          grip.y + Math.sin(angle) * 12 * t - bend * t * t,
          0.2,
        );
        const rod = rods[i]!;
        rod.position.copy(previous).add(next).multiplyScalar(0.5);
        rod.scale.set(1 - t * 0.5, previous.distanceTo(next), 1 - t * 0.5);
        rod.rotation.z = Math.atan2(next.y - previous.y, next.x - previous.x) - Math.PI / 2;
        previous = next;
        tip.copy(next);
      }
      reel.position.copy(grip).add(new THREE.Vector3(0.4, -0.45, 0));
      const wobble = reducedMotion ? 0 : Math.sin(age * (bite ? 24 : 3)) * (bite ? 0.5 : 0.1);
      const reach = fighting ? 19 - frame.progress * 0.08 : 19;
      const water = new THREE.Vector3(reach, -2.2 + wobble - (bite ? 0.55 : 0), 0.2);
      if (casting) {
        water.lerpVectors(grip, water, cast);
        water.y += Math.sin(cast * Math.PI) * 7;
      }
      if (missed) water.lerp(tip.clone().add(new THREE.Vector3(0, -3, 0)), Math.min(1, age * 2));
      if (caught) water.set(celebration.fishX, celebration.fishY - celebration.childLift, 0.2);
      if (fighting && !reducedMotion)
        water.x += Math.sin(age * (frame.isSurging ? 12 : 6)) * (frame.isSurging ? 1.2 : 0.4);
      bobber.position.copy(water);
      bobber.visible = !caught && !missed;
      fish.visible = caught;
      fish.position.copy(water);
      const fishScale =
        species && frame.caught ? 1.2 + ((frame.caught.size - species.min) / (species.max - species.min)) * 0.5 : 1.2;
      let fishWidth = 0.8;
      let fishHeight = 1.7;
      if (species?.shape === FISH_SHAPE.round) {
        fishWidth = 1.25;
        fishHeight = 1.45;
      }
      if (species?.shape === FISH_SHAPE.flat) {
        fishWidth = 1.55;
        fishHeight = 1.2;
      }
      fish.scale.set(fishWidth * fishScale, fishHeight * fishScale, 1);
      fishMaterial.color.setHex(species?.color ?? 0xa3cfcb);
      fish.rotation.z = reducedMotion ? 0 : celebration.fishTurn + Math.sin(age * 12) * 0.12;
      let heartCount = 3;
      if (isRare) heartCount = 5;
      if (isLegendary) heartCount = 7;
      hearts.forEach((heart, index) => {
        const pose = catchHeart(age, index, reducedMotion);
        heart.visible = caught && index < heartCount && pose.isVisible;
        heart.position.set(pose.x, pose.y - celebration.childLift, 0.4);
        heart.scale.setScalar(pose.scale);
        heart.material.opacity = pose.opacity;
        heart.material.color.setHex(isLegendary ? 0xffc878 : 0xf197ad);
      });
      stars.forEach((star, index) => {
        const t = Math.max(0, age - 0.45);
        const angle = (index * Math.PI) / 3 + (reducedMotion ? 0 : t * 0.8);
        const radius = reducedMotion ? 2.7 : 1.7 + t * 1.4;
        star.visible = caught && isRare && age >= 0.45 && age < 2.4;
        star.position.set(water.x + Math.cos(angle) * radius, water.y + Math.sin(angle) * radius, 0.3);
        star.material.opacity = Math.max(0, Math.sin(Math.min(1, t / 1.95) * Math.PI));
        star.scale.setScalar(isLegendary ? 1.4 : 1);
      });
      ripple.visible = (!casting && !caught && !missed) || (caught && celebration.splash > 0);
      ripple.position.copy(water);
      if (caught) ripple.position.set(11, -2.2 - celebration.childLift, 0.2);
      const wave = reducedMotion ? 1 : 0.8 + (age % 1.4);
      ripple.scale.set(wave * (bite ? 1.8 : 1), wave * 0.35, 1);
      ringMaterial.opacity = reducedMotion ? 0.4 : Math.max(0, 0.65 - (age % 1.4) * 0.4);
      if (caught) {
        ripple.scale.set(1 + age * 6, 0.35 + age * 2, 1);
        ringMaterial.opacity = celebration.splash;
      }
      for (let i = 0; i < 25; i++) {
        const t = i / 24;
        linePoints[i * 3] = THREE.MathUtils.lerp(tip.x, water.x, t);
        linePoints[i * 3 + 1] =
          THREE.MathUtils.lerp(tip.y, water.y, t) - Math.sin(t * Math.PI) * (fighting ? 0.2 : 1.3);
        linePoints[i * 3 + 2] = 0.2;
      }
      lineGeometry.attributes.position!.needsUpdate = true;
      line.visible = !missed || age < 0.4;
    },
    dispose() {
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
    },
  };
}
