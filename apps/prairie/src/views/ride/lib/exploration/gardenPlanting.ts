import { GARDEN_PLANTING } from '@views/ride/config/gardenPlanting';
import { Color, Matrix4, Object3D } from 'three';

export const flowerColors = ['#dca9c1', '#b5a5d9', '#f4e0a8'].map((hex) => new Color(hex));

type HeightAt = (x: number, z: number) => number;

export interface GardenStem {
  x: number;
  y: number;
  z: number;
  height: number;
  angle: number;
}

export interface GardenLayout {
  stems: GardenStem[];
  blooms: Matrix4[];
  bloomColors: Color[];
  leaves: Matrix4[];
}

const { petal, vine } = GARDEN_PLANTING;

function plantStem(index: number, heightAt: HeightAt) {
  const patch = Math.floor(index / GARDEN_PLANTING.patchSize);
  const angle = index * GARDEN_PLANTING.goldenAngle;
  const spread = GARDEN_PLANTING.spreadBase + (index % GARDEN_PLANTING.patchSize) * GARDEN_PLANTING.spreadStep;
  const patchAngle = patch * GARDEN_PLANTING.patchAngleStep;
  const x = Math.cos(patchAngle) * GARDEN_PLANTING.patchRadius + Math.cos(angle) * spread;
  const z = Math.sin(patchAngle) * GARDEN_PLANTING.patchRadius + Math.sin(angle) * spread;
  const ground = heightAt(x, z);
  const height = GARDEN_PLANTING.heightBase + (index % GARDEN_PLANTING.heightVariants) * GARDEN_PLANTING.heightStep;
  return { patch, ground, stem: { x, y: ground + height / 2, z, height, angle } };
}

function bloomMatrices(stem: GardenStem, top: number, dummy: Object3D) {
  return Array.from({ length: petal.count }, (_, index) => {
    const angle = index * petal.angleStep;
    dummy.position.set(stem.x + Math.cos(angle) * petal.ringRadius, top, stem.z + Math.sin(angle) * petal.ringRadius);
    dummy.rotation.set(petal.tilt, -angle, 0);
    dummy.scale.set(...petal.scale);
    dummy.updateMatrix();
    return dummy.matrix.clone();
  });
}

function vineLeafMatrix(index: number, heightAt: HeightAt, dummy: Object3D) {
  const column = Math.floor(index / vine.leavesPerColumn) % vine.columns;
  const step = index % vine.leavesPerColumn;
  const theta = (column * Math.PI) / (vine.columns / 2);
  const twist = step * vine.twistStep;
  const columnX = Math.cos(theta) * vine.ringRadius;
  const columnZ = Math.sin(theta) * vine.ringRadius;
  const rise = (step * (vine.riseBase + (column % vine.riseVariants))) / vine.riseDivisor;
  dummy.rotation.set(0, theta, column % 2 ? vine.leanOdd : vine.leanEven);
  dummy.position.set(Math.cos(twist) * vine.coilRadius, rise, Math.sin(twist) * vine.coilRadius);
  dummy.position.applyEuler(dummy.rotation);
  dummy.position.x += columnX;
  dummy.position.z += columnZ;
  dummy.position.y += heightAt(columnX, columnZ);
  dummy.rotation.set(vine.leafTilt, twist + theta, vine.leafRoll);
  dummy.scale.set(...vine.leafScale);
  dummy.updateMatrix();
  return dummy.matrix.clone();
}

export function createGardenLayout(heightAt: HeightAt): GardenLayout {
  const dummy = new Object3D();
  const layout: GardenLayout = { stems: [], blooms: [], bloomColors: [], leaves: [] };
  for (let index = 0; index < GARDEN_PLANTING.stemCount; index++) {
    const { patch, ground, stem } = plantStem(index, heightAt);
    const color = flowerColors[patch % flowerColors.length]!;
    layout.stems.push(stem);
    for (const matrix of bloomMatrices(stem, ground + stem.height, dummy)) {
      layout.blooms.push(matrix);
      layout.bloomColors.push(color);
    }
    layout.leaves.push(vineLeafMatrix(index, heightAt, dummy));
  }
  return layout;
}

export function swayStemMatrix(stem: GardenStem, index: number, elapsed: number, dummy: Object3D) {
  dummy.position.set(stem.x, stem.y, stem.z);
  dummy.rotation.set(0, stem.angle, Math.sin(elapsed + index) * GARDEN_PLANTING.swayAmplitude);
  dummy.scale.set(GARDEN_PLANTING.stemWidth, stem.height, GARDEN_PLANTING.stemWidth);
  dummy.updateMatrix();
  return dummy.matrix;
}
