'use client';
import { GARDEN_BLOOM_COUNT, GARDEN_GEOMETRY, GARDEN_PLANTING } from '@views/ride/config/gardenPlanting';
import { useGardenPlanting } from '@views/ride/model/exploration/useGardenPlanting';
import { DoubleSide } from 'three';

export function GardenPlanting() {
  const { blooms, stems, leaves } = useGardenPlanting();
  return (
    <>
      <instancedMesh ref={blooms} args={[undefined, undefined, GARDEN_BLOOM_COUNT]} frustumCulled={false}>
        <sphereGeometry args={GARDEN_GEOMETRY.bloom} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={stems} args={[undefined, undefined, GARDEN_PLANTING.stemCount]} frustumCulled={false}>
        <cylinderGeometry args={GARDEN_GEOMETRY.stem} />
        <meshStandardMaterial color="#6c8550" />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, GARDEN_PLANTING.stemCount]} frustumCulled={false}>
        <octahedronGeometry args={GARDEN_GEOMETRY.leaf} />
        <meshStandardMaterial color="#759267" side={DoubleSide} />
      </instancedMesh>
    </>
  );
}
