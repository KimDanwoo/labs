import * as THREE from 'three/webgpu';
import type { Parts } from './islandGeometry';
import type { PartName } from './islandMaterials';
const HONGSALMUN = {
  postX: [-16.4, -2.7],
  z: -16.32,
  bottom: -1,
  lowerBeam: 3.72,
  upperBeam: 4.2,
  slatTop: 4.95,
  slatGap: 0.55,
  sides: 8,
  baseTopRadius: 0.32,
  baseBottomRadius: 0.36,
  baseHeight: 0.3,
  postTopRadius: 0.18,
  postBottomRadius: 0.2,
  bindingRadius: 0.205,
  bindingHeight: 0.08,
  bindingLevels: [0.55, 2.6],
  beamRadius: 0.09,
  beamOverhang: 0.5,
  beamRotation: Math.PI / 2,
  jointRadius: 0.112,
  jointWidth: 0.06,
  flagWidth: 0.34,
  flagHeight: 0.28,
  flagDepthOffset: 0.12,
  flagShades: ['bunting1', 'bunting2', 'bunting3', 'bunting4', 'bunting5'] satisfies readonly PartName[],
  flowerTopInset: 0.23,
  flowerDepthOffset: 0.23,
  flowerOrbit: 0.12,
  flowerPetalRadius: 0.095,
  flowerCenterRadius: 0.065,
  flowerDepth: 0.04,
  flowerCenterDepthOffset: 0.025,
  flowerPetals: 5,
  flowerSides: 5,
  fullTurn: Math.PI * 2,
} as const;
function pennantGeometry(): THREE.BufferGeometry {
  const style = HONGSALMUN;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-style.flagWidth / 2, 0, 0, 0, -style.flagHeight, 0, style.flagWidth / 2, 0, 0],
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 2, 1, 0]);
  geometry.computeVertexNormals();
  return geometry;
}
function hongsalmunPosts(parts: Parts): void {
  const style = HONGSALMUN;
  const { z, bottom, slatTop } = style;
  for (const x of style.postX) {
    parts.prism(
      'sand',
      style.baseTopRadius,
      style.baseBottomRadius,
      style.baseHeight,
      { position: [x, bottom + style.baseHeight / 2, z] },
      style.sides,
    );
    parts.prism(
      'bamboo',
      style.postTopRadius,
      style.postBottomRadius,
      slatTop - bottom,
      { position: [x, (slatTop + bottom) / 2, z] },
      style.sides,
    );
    for (const level of style.bindingLevels) {
      parts.prism(
        'thatchRope',
        style.bindingRadius,
        style.bindingRadius,
        style.bindingHeight,
        { position: [x, bottom + level, z] },
        style.sides,
      );
    }
  }
}
function hongsalmunFlowers(parts: Parts): void {
  const style = HONGSALMUN;
  const flowerY = style.slatTop - style.flowerTopInset;
  const facing = [style.beamRotation, 0, 0] as const;
  for (const [postIndex, x] of style.postX.entries()) {
    const petalShade: PartName = postIndex === 0 ? 'bunting2' : 'bunting4';
    for (let petal = 0; petal < style.flowerPetals; petal += 1) {
      const angle = (style.fullTurn * petal) / style.flowerPetals;
      parts.prism(
        petalShade,
        style.flowerPetalRadius,
        style.flowerPetalRadius,
        style.flowerDepth,
        {
          position: [
            x + Math.cos(angle) * style.flowerOrbit,
            flowerY + Math.sin(angle) * style.flowerOrbit,
            style.z + style.flowerDepthOffset,
          ],
          rotation: facing,
        },
        style.flowerSides,
      );
    }
    parts.prism(
      'bunting3',
      style.flowerCenterRadius,
      style.flowerCenterRadius,
      style.flowerDepth,
      { position: [x, flowerY, style.z + style.flowerDepthOffset + style.flowerCenterDepthOffset], rotation: facing },
      style.flowerSides,
    );
  }
}
export function hongsalmun(parts: Parts): void {
  const style = HONGSALMUN;
  const { z, lowerBeam, upperBeam, slatGap } = style;
  const [left, right] = style.postX;
  const width = right - left;
  const centerX = (left + right) / 2;
  const beamRotation = [0, 0, style.beamRotation] as const;

  hongsalmunPosts(parts);
  for (const y of [lowerBeam, upperBeam]) {
    parts.prism(
      'bamboo',
      style.beamRadius,
      style.beamRadius,
      width + style.beamOverhang,
      { position: [centerX, y, z], rotation: beamRotation },
      style.sides,
    );
  }
  for (let index = 0; left + slatGap * (index + 1) < right - slatGap / 2; index += 1) {
    const x = left + slatGap * (index + 1);
    parts.prism(
      'thatchRope',
      style.jointRadius,
      style.jointRadius,
      style.jointWidth,
      { position: [x, upperBeam, z], rotation: beamRotation },
      style.sides,
    );
    parts.add(style.flagShades[index % style.flagShades.length] ?? 'bunting1', pennantGeometry(), {
      position: [x, upperBeam - style.beamRadius, z + style.flagDepthOffset],
    });
  }
  hongsalmunFlowers(parts);
}
