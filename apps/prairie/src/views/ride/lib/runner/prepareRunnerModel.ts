import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Group, type Material } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { UNICORN_TINT } from '../../model/runner/constants';

export interface PreparedRunner {
  model: Group;
  materials: MeshStandardMaterial[];
}

const COAT_NAMES = ['Main', 'Main_Light'];
const EYE_NAMES = ['Eye_Black', 'Eye_White'];

function isCoat(name: string): boolean {
  return COAT_NAMES.includes(name);
}

function applyCoat(copy: MeshPhysicalMaterial): void {
  copy.clearcoat = 0.2;
  copy.clearcoatRoughness = 0.5;
  copy.iridescence = 0.18;
  copy.iridescenceIOR = 1.25;
  copy.iridescenceThicknessRange = [160, 320];
}

function applyEyes(copy: MeshPhysicalMaterial): void {
  copy.roughness = 0.12;
  copy.clearcoat = 1;
  copy.clearcoatRoughness = 0.08;
}

function polishedCopy(material: MeshStandardMaterial): MeshPhysicalMaterial {
  const copy = new MeshPhysicalMaterial();
  MeshStandardMaterial.prototype.copy.call(copy, material);
  copy.sheen = isCoat(copy.name) ? 0.3 : 0;
  copy.sheenColor.set('#fff1db');
  copy.sheenRoughness = 0.75;
  const tint = UNICORN_TINT[copy.name];
  if (tint) copy.color.set(tint);
  copy.metalness = 0;
  copy.roughness = 0.56;
  if (copy.name === 'Eye_Black') copy.roughness = 0.16;
  if (isCoat(copy.name)) {
    copy.sheen = 0.65;
    copy.sheenColor.set('#c9ddff');
    copy.roughness = 0.52;
  }
  if (copy.name === 'Hooves') {
    copy.metalness = 0.8;
    copy.roughness = 0.22;
  }
  if (EYE_NAMES.includes(copy.name)) applyEyes(copy);
  copy.envMapIntensity = 0.85;
  if (isCoat(copy.name)) applyCoat(copy);
  copy.flatShading = false;
  return copy;
}

function prepareMesh(object: Mesh, materials: MeshStandardMaterial[]): void {
  object.castShadow = true;
  object.receiveShadow = true;
  const source = Array.isArray(object.material) ? object.material : [object.material];
  if (source.length === 1 && source[0]?.name === 'Hair') {
    object.visible = false;
    return;
  }
  const copies = source.map((material: Material) => {
    if (!(material instanceof MeshStandardMaterial)) return material;
    const copy = polishedCopy(material);
    materials.push(copy);
    return copy;
  });
  object.material = Array.isArray(object.material) ? copies : copies[0]!;
}

export function prepareRunnerModel(scene: Group): PreparedRunner {
  const model = clone(scene) as Group;
  const materials: MeshStandardMaterial[] = [];
  model.traverse((object) => {
    if (object instanceof Mesh) prepareMesh(object, materials);
  });
  return { model, materials };
}
