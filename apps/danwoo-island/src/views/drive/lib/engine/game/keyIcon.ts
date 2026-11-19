import { texture, uv, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const KEY_ICON_RENDER_ORDER = 8;
export const KEY_ICON_SCALE = 0.25;
export function flippedUvTexture(map: THREE.Texture): THREE.Node<'float'> {
  return texture(map, vec2(uv().x, uv().y.oneMinus())).r;
}
