import * as THREE from 'three';
import { CAST_SECONDS, FISHING_PHASE, type FishingFrame } from './fishing';

/** Fishing tackle lives in the same scene and perspective as the child's hands. */
export function createPierFishing(scene: THREE.Scene) {
  const group = new THREE.Group();
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
  const fishGeometry = new THREE.CircleGeometry(0.6, 16);
  const fish = new THREE.Mesh(fishGeometry, fishMaterial);
  fish.scale.set(0.65, 1.4, 1);
  fish.renderOrder = 7;
  const tailGeometry = new THREE.CircleGeometry(0.45, 3);
  const tail = new THREE.Mesh(tailGeometry, fishMaterial);
  tail.position.y = -0.9;
  fish.add(tail);
  group.add(fish);
  const reel = new THREE.Mesh(floatGeometry, rodMaterial);
  reel.scale.setScalar(1.2);
  reel.renderOrder = 7;
  group.add(reel);
  let phase: FishingFrame['phase'] | null = null;
  let age = 0;
  return {
    update(dt: number, frame: FishingFrame | null, origin: THREE.Vector3, size: number, reducedMotion: boolean) {
      group.visible = frame !== null;
      if (!frame) {
        phase = null;
        return;
      }
      age = phase === frame.phase ? age + dt : 0;
      phase = frame.phase;
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
      const bend = fighting ? (frame.tension / 100) * 3.5 : 0.3;
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
      if (caught || missed) water.lerp(tip.clone().add(new THREE.Vector3(0, -3, 0)), Math.min(1, age * 2));
      if (fighting && !reducedMotion) water.x += Math.sin(age * 6) * 0.6;
      bobber.position.copy(water);
      bobber.visible = !caught && !missed;
      fish.visible = caught;
      fish.position.copy(water);
      fish.rotation.z = reducedMotion ? 0 : Math.sin(age * 12) * 0.16;
      ripple.visible = !casting && !caught && !missed;
      ripple.position.copy(water);
      const wave = reducedMotion ? 1 : 0.8 + (age % 1.4);
      ripple.scale.set(wave * (bite ? 1.8 : 1), wave * 0.35, 1);
      ringMaterial.opacity = reducedMotion ? 0.4 : Math.max(0, 0.65 - (age % 1.4) * 0.4);
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
      [cylinder, lineGeometry, floatGeometry, ringGeometry, fishGeometry, tailGeometry].forEach((geometry) =>
        geometry.dispose(),
      );
      [rodMaterial, floatMaterial, paleMaterial, fishMaterial, lineMaterial, ringMaterial].forEach((material) =>
        material.dispose(),
      );
    },
  };
}
