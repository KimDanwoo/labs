import { UNICORN_TINT } from '@views/ride/model/runner/constants';
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Group, type Material } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

interface RunnerMeshFinish {
  mesh: Mesh;
  detailed: Material | Material[];
  simple: Material | Material[];
}

export interface PreparedRunner {
  model: Group;
  meshes: RunnerMeshFinish[];
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

function simpleCopy(polished: MeshStandardMaterial): MeshStandardMaterial {
  return new MeshStandardMaterial().copy(polished);
}

function finishCopies(
  source: Material[],
  materials: MeshStandardMaterial[],
): { detailed: Material[]; simple: Material[] } {
  const detailed = source.map((material) =>
    material instanceof MeshStandardMaterial ? polishedCopy(material) : material,
  );
  const simple = detailed.map((material) =>
    material instanceof MeshPhysicalMaterial ? simpleCopy(material) : material,
  );
  for (const material of [...detailed, ...simple]) {
    const isNewStandardMaterial = material instanceof MeshStandardMaterial && !materials.includes(material);
    if (isNewStandardMaterial) materials.push(material);
  }
  return { detailed, simple };
}

function prepareMesh(object: Mesh, prepared: PreparedRunner): void {
  object.castShadow = true;
  object.receiveShadow = true;
  const source = Array.isArray(object.material) ? object.material : [object.material];
  const isSingleHair = source.length === 1 && source[0]?.name === 'Hair';
  if (isSingleHair) {
    object.visible = false;
    return;
  }
  const { detailed, simple } = finishCopies(source, prepared.materials);
  const pick = (copies: Material[]) => (Array.isArray(object.material) ? copies : copies[0]!);
  prepared.meshes.push({ mesh: object, detailed: pick(detailed), simple: pick(simple) });
  object.material = pick(detailed);
}

export function prepareRunnerModel(scene: Group): PreparedRunner {
  const prepared: PreparedRunner = { model: clone(scene) as Group, meshes: [], materials: [] };
  prepared.model.traverse((object) => {
    if (object instanceof Mesh) prepareMesh(object, prepared);
  });
  return prepared;
}

export function applyRunnerDetail({ meshes }: PreparedRunner, isLowDetail: boolean): void {
  for (const { mesh, detailed, simple } of meshes) {
    mesh.material = isLowDetail ? simple : detailed;
    mesh.castShadow = !isLowDetail;
  }
}
