import { ToonMaterial } from '@shared/r3f';
import { VILLAGE_COLORS, type TreePlacement } from '../model/constants';

type TreeProps = TreePlacement;

// kind 'a' = 둥근 활엽수(구), 'b' = 침엽수(원뿔 적층).
export function Tree({ position, scale, kind }: TreeProps) {
  return (
    <group position={[position[0], 0, position[1]]} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 1.4, 8]} />
        <ToonMaterial color={VILLAGE_COLORS.trunk} />
      </mesh>

      {kind === 'a' ? (
        <>
          <mesh position={[0, 1.9, 0]} castShadow>
            <sphereGeometry args={[1.1, 12, 12]} />
            <ToonMaterial color={VILLAGE_COLORS.foliageA} />
          </mesh>
          <mesh position={[0.5, 2.6, 0.2]} castShadow>
            <sphereGeometry args={[0.7, 10, 10]} />
            <ToonMaterial color={VILLAGE_COLORS.foliageC} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.7, 0]} castShadow>
            <coneGeometry args={[1.0, 1.6, 9]} />
            <ToonMaterial color={VILLAGE_COLORS.foliageB} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[0.75, 1.3, 9]} />
            <ToonMaterial color={VILLAGE_COLORS.foliageB} />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <coneGeometry args={[0.5, 1.0, 9]} />
            <ToonMaterial color={VILLAGE_COLORS.foliageA} />
          </mesh>
        </>
      )}
    </group>
  );
}
