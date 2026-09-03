import { HORN } from '@entities/runner/model/constants';
import { AdditiveBlending } from 'three';

// Head 뼈의 자식으로 렌더된다(createPortal). 원뿔은 +Y를 향하므로 X축 +90°로 돌려 Head 로컬 +Z(위·앞)로 세우고, 코 쪽(+Y)으로 살짝 기울인다.
export function Horn() {
  return (
    <group scale={HORN.boneScaleFix}>
      <group position={HORN.position} rotation={[Math.PI / 2 - HORN.tiltForward, 0, 0]}>
        <mesh position={[0, HORN.height / 2, 0]}>
          <coneGeometry args={[HORN.radius, HORN.height, 10]} />
          <meshBasicMaterial color={HORN.color} />
        </mesh>
        <mesh position={[0, HORN.height / 2, 0]} scale={[HORN.glowScale, 1.08, HORN.glowScale]}>
          <coneGeometry args={[HORN.radius, HORN.height, 10]} />
          <meshBasicMaterial
            color={HORN.glowColor}
            transparent
            opacity={0.35}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
