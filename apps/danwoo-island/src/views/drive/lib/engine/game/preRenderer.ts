import CubeRenderTarget from 'three/src/renderers/common/CubeRenderTarget.js';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';

const CUBE_SIZE = 32;
const CAMERA_NEAR = 1;
const CAMERA_FAR = 100000;

function revealHiddenObjects(scene: THREE.Scene): THREE.Object3D[] {
  const revealed: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (child.visible) return;
    if (child.userData.preventPreRender !== undefined) return;
    child.visible = true;
    revealed.push(child);
  });
  return revealed;
}

export function preRender(): void {
  const { scene, rendering } = getGame();
  const renderTarget = new CubeRenderTarget(CUBE_SIZE);
  const cubeCamera = new THREE.CubeCamera(CAMERA_NEAR, CAMERA_FAR, renderTarget);
  scene.add(cubeCamera);

  const revealed = revealHiddenObjects(scene);
  cubeCamera.update(rendering.renderer, scene);
  for (const child of revealed) child.visible = false;

  cubeCamera.removeFromParent();
  renderTarget.dispose();
}
