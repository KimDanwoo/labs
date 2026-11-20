import { Fn, texture, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { INPUT_MODE } from '@views/drive/lib/engine/game/inputs/inputTypes';
import type { SharedParts } from '@views/drive/lib/engine/game/interactivePointShared';

const KEY_ICON_RENDER_ORDER = 8;
export const KEY_ICON_SCALE = 0.25;
function flippedUvTexture(map: THREE.Texture): THREE.Node<'float'> {
  return texture(map, vec2(uv().x, uv().y.oneMinus())).r;
}

export function createKeyIcon(plane: THREE.PlaneGeometry, frontColor: SharedParts['frontColor']): THREE.Mesh {
  const game = getGame();
  const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: false });
  const iconOutput = Fn(([iconAlpha]: [THREE.Node<'float'>]): THREE.Node<'vec4'> => {
    iconAlpha.lessThan(0.5).discard();
    return vec4(frontColor, 1);
  });
  const useIcon = (name: string): void => {
    material.outputNode = iconOutput(flippedUvTexture(game.texture(name)));
    material.needsUpdate = true;
  };
  material.outputNode = iconOutput(flippedUvTexture(game.texture('interactivePointsKeyIconEnterTexture')));

  const mesh = new THREE.Mesh(plane, material);
  mesh.renderOrder = KEY_ICON_RENDER_ORDER;
  mesh.scale.setScalar(0);
  mesh.position.z = 0.01;
  mesh.visible = false;

  const gamepadIcon = (): string =>
    game.inputs.gamepad.type === 'xbox' ? 'interactivePointsKeyIconATexture' : 'interactivePointsKeyIconCrossTexture';
  game.inputs.gamepad.events.on('typeChange', () => {
    if (game.inputs.mode === INPUT_MODE.gamepad) useIcon(gamepadIcon());
  });
  game.inputs.modeEvents.on('change', () => {
    const { mode } = game.inputs;
    if (mode === INPUT_MODE.gamepad) useIcon(gamepadIcon());
    else if (mode === INPUT_MODE.mouseKeyboard) useIcon('interactivePointsKeyIconEnterTexture');
    else if (mode === INPUT_MODE.touch) mesh.visible = false;
  });
  return mesh;
}
