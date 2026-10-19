'use client';

import { useFrame } from '@react-three/fiber';
import { runnerState } from '@shared/r3f';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, InstancedMesh, Object3D, Shape, ShapeGeometry, Vector3 } from 'three';

const COUNT = 180;
const COLORS = ['#ffe09b', '#fff3d4', '#bceaff', '#e4c9ff'];

export function SpinStardust() {
  const meshRef = useRef<InstancedMesh>(null);
  const accumulator = useRef(0);
  const cursor = useRef(0);
  const dummy = useMemo(() => new Object3D(), []);
  const particlesRef = useRef<Array<{
    position: Vector3;
    velocity: Vector3;
    life: number;
    size: number;
    rotation: number;
  }> | null>(null);
  const geometry = useMemo(() => {
    const shape = new Shape();
    for (let i = 0; i < 8; i += 1) {
      const angle = (i * Math.PI) / 4;
      const radius = i % 2 === 0 ? 1 : 0.24;
      const x = Math.cos(angle) * radius,
        y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return new ShapeGeometry(shape);
  }, []);
  const colors = useMemo(() => COLORS.map((color) => new Color(color)), []);

  useFrame(({ camera }, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const particles = (particlesRef.current ??= Array.from({ length: COUNT }, () => ({
      position: new Vector3(),
      velocity: new Vector3(),
      life: 0,
      size: 0,
      rotation: 0,
    })));
    const delta = Math.min(rawDelta, 0.05);
    accumulator.current =
      runnerState.isSpinning || runnerState.dashStrength > 0 ? accumulator.current + delta * 160 : 0;
    while (accumulator.current >= 1) {
      accumulator.current -= 1;
      const index = cursor.current++ % COUNT;
      const particle = particles[index]!;
      const angle = (runnerState.isSpinning ? runnerState.spinAngle : Math.PI * 0.1) + (index % 2) * Math.PI;
      const radius = 1.3 + Math.random() * 0.6;
      const side = Math.cos(angle) * radius;
      particle.position.set(
        runnerState.position.x + Math.cos(runnerState.heading) * side,
        runnerState.position.y + 1.3 + Math.sin(angle) * radius,
        runnerState.position.z - Math.sin(runnerState.heading) * side,
      );
      particle.velocity.set(
        Math.cos(runnerState.heading) * side * 0.7,
        Math.sin(angle) * 0.6 + 0.4,
        -Math.sin(runnerState.heading) * side * 0.7,
      );
      if (runnerState.dashStrength > 0) {
        particle.velocity.x -= Math.sin(runnerState.heading) * 5 * runnerState.dashStrength;
        particle.velocity.z -= Math.cos(runnerState.heading) * 5 * runnerState.dashStrength;
      }
      particle.life = 1;
      particle.size = 0.06 + Math.random() * 0.1;
      particle.rotation = Math.random() * Math.PI;
    }
    for (let i = 0; i < COUNT; i += 1) {
      const particle = particles[i]!;
      particle.life = Math.max(0, particle.life - delta / 1.2);
      particle.position.addScaledVector(particle.velocity, delta);
      dummy.position.copy(particle.position);
      dummy.quaternion.copy(camera.quaternion);
      dummy.rotateZ(particle.rotation + (1 - particle.life) * 2);
      dummy.scale.setScalar(particle.size * Math.sin(particle.life * Math.PI));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colors[i % colors.length]!);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, COUNT]} frustumCulled={false}>
      <meshBasicMaterial transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
