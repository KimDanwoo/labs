import { shadow } from 'three/tsl';
import * as THREE from 'three/webgpu';

type Restore = () => void;

const WARM_TARGET_SIZE = 1;
const SHADOW_CLEAR_ALPHA = 0;

export const READS_FRAMEBUFFER = 'readsFramebuffer';

type Toggle = 'visible' | 'frustumCulled';

function flipWhere(scene: THREE.Scene, toggle: Toggle, shouldFlip: (child: THREE.Object3D) => boolean): Restore {
  const flipped: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (!shouldFlip(child)) return;
    child[toggle] = !child[toggle];
    flipped.push(child);
  });
  return () => {
    for (const child of flipped) child[toggle] = !child[toggle];
  };
}

const isEmptyMesh = (child: THREE.Object3D): boolean =>
  child instanceof THREE.Mesh && !child.geometry.hasAttribute('position');

const isHiddenByDefault = (child: THREE.Object3D): boolean =>
  !child.visible && child.userData.preventPreRender === undefined;

const isCullable = (child: THREE.Object3D): boolean => child.frustumCulled && !isEmptyMesh(child);

const isVisibleFramebufferReader = (child: THREE.Object3D): boolean =>
  child.visible && child.userData[READS_FRAMEBUFFER] === true;

export const revealHiddenObjects = (scene: THREE.Scene): Restore => flipWhere(scene, 'visible', isHiddenByDefault);

export const disableFrustumCulling = (scene: THREE.Scene): Restore => flipWhere(scene, 'frustumCulled', isCullable);

const hideFramebufferReaders = (scene: THREE.Scene): Restore => flipWhere(scene, 'visible', isVisibleFramebufferReader);

export function exposeWholeScene(scene: THREE.Scene): Restore {
  const hideAgain = revealHiddenObjects(scene);
  const cullAgain = disableFrustumCulling(scene);
  const showReaders = hideFramebufferReaders(scene);
  return () => {
    showReaders();
    cullAgain();
    hideAgain();
  };
}

export const castsShadow = (object: THREE.Object3D): boolean => object.castShadow;

function shadowVariantKey(mesh: THREE.Mesh): string {
  const materials = [mesh.material].flat().map((material) => material.uuid);
  const attributes = Object.keys(mesh.geometry.attributes);
  const isMirrored = mesh.matrixWorld.determinant() < 0;
  return [mesh.type, ...materials, ...attributes, isMirrored].join('|');
}

export function collectShadowVariants(scene: THREE.Scene): THREE.Mesh[] {
  const variants = new Map<string, THREE.Mesh>();
  scene.traverse((child) => {
    if (!child.castShadow) return;
    if (!(child instanceof THREE.Mesh)) return;
    const key = shadowVariantKey(child);
    if (!variants.has(key)) variants.set(key, child);
  });
  return [...variants.values()];
}

export function whenShadowSetUp(light: THREE.DirectionalLight): Promise<void> {
  const provisional = shadow(light, light.shadow).getShadowMaterial();
  return new Promise((resolve) => provisional.addEventListener('dispose', () => resolve()));
}

export function warmShadowPipelines(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  light: THREE.DirectionalLight,
  isWarmed: (object: THREE.Object3D) => boolean,
): void {
  const lightShadow = light.shadow;
  const shadowNode = shadow(light, lightShadow);
  const target = new THREE.RenderTarget(WARM_TARGET_SIZE, WARM_TARGET_SIZE, {
    type: lightShadow.mapType,
    depthTexture: new THREE.DepthTexture(WARM_TARGET_SIZE, WARM_TARGET_SIZE),
  });
  const rendererState = THREE.RendererUtils.resetRendererState(
    renderer,
    THREE.RendererUtils.saveRendererState(renderer),
  );
  const sceneState = THREE.RendererUtils.resetSceneState(scene, THREE.RendererUtils.saveSceneState(scene));
  scene.overrideMaterial = shadowNode.getShadowMaterial();
  renderer.setRenderObjectFunction((object, ...rest) => {
    if (isWarmed(object)) renderer.renderObject(object, ...rest);
  });
  renderer.setClearColor(0x000000, SHADOW_CLEAR_ALPHA);
  renderer.setRenderTarget(target);
  lightShadow.updateMatrices(light);
  renderer.render(scene, lightShadow.camera);
  THREE.RendererUtils.restoreRendererState(renderer, rendererState);
  THREE.RendererUtils.restoreSceneState(scene, sceneState);
  target.dispose();
}
