import gsap from 'gsap';
import {
  cameraPosition,
  color,
  Fn,
  min,
  mix,
  normalWorld,
  positionWorld,
  screenCoordinate,
  texture,
  uniform,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial, revealNode } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import {
  type BlinkerCallbacks,
  type PaintName,
  BLINK_INTERVAL,
} from '@views/drive/lib/engine/game/world/visualVehicleParts';

function flamesPaint(red: THREE.Material): THREE.Material | undefined {
  if (!(red instanceof MeshDefaultMaterial)) return undefined;
  const material = red.clone();
  const { ticker, noises } = getGame();
  const baseOutput = red.shadedOutput;
  const colorA = uniform(color('#ff9c20'));
  const colorB = uniform(color('#ff0000'));
  const emissiveStrength = uniform(7.75);
  material.outputNode = Fn(() => {
    const flameUv = uv(1).toVar();
    const uv3 = flameUv.sub(vec2(0, ticker.elapsedScaledUniform.mul(-0.075))).mul(vec2(0.96 * 1.3, 0.35 * 1.3));
    const uv4 = flameUv.sub(vec2(0, ticker.elapsedScaledUniform.mul(-0.041))).mul(vec2(1.28 * 1.3, 0.75 * 1.3));
    const noise = min(texture(noises.voronoi, uv3).r, texture(noises.voronoi, uv4).r);
    const flameMix = noise.step(flameUv.y.oneMinus());
    const flameColor = mix(colorA, colorB, flameUv.y).mul(emissiveStrength);
    baseOutput.rgb.assign(mix(baseOutput.rgb, flameColor, flameMix));
    return baseOutput;
  })();
  return material;
}

function abyssalPaint(): THREE.Material {
  const game = getGame();
  const stars = game.texture('behindTheSceneStarsTexture');
  const fresnelColor = uniform(color('#6053ff'));
  const fresnelIntensity = uniform(30);
  const starsIntensity = uniform(10);
  const outputNode = Fn(() => {
    const starsColor = texture(stars, screenCoordinate.div(256).fract()).rgb.pow(2).mul(starsIntensity);
    const viewDirection = positionWorld.sub(cameraPosition).normalize();
    const fresnel = viewDirection.dot(normalWorld).remapClamp(-0.2, -0.4, 1, 0);
    const finalColor = mix(starsColor, fresnelColor.mul(fresnelIntensity), fresnel).toVar();
    finalColor.assign(revealNode(finalColor));
    return vec4(finalColor, 1);
  })();
  const material = new THREE.MeshBasicNodeMaterial({ wireframe: false });
  material.outputNode = outputNode;
  return material;
}

export function createPaints(model: THREE.Object3D): Partial<Record<PaintName, THREE.Material>> {
  const { materials } = getGame();
  const red = materials.get('redGradient');
  const orange = materials.createGradient('orangeGradient', '#ff940d', '#af0071');
  const white = materials.createGradient('whiteGradient', '#ffffff', '#b5b5b5');
  const black = materials.createGradient('blackGradient', '#626262', '#262526');
  const isIsland = model.name === 'islandBoxySUV';
  return {
    red,
    orange,
    white,
    black: isIsland ? materials.createGradient('islandGraphite', '#434b53', '#171c23') : black,
    flames: flamesPaint(red),
    abyssal: abyssalPaint(),
  };
}

export function bindBlinkers(
  left: THREE.Object3D | undefined,
  right: THREE.Object3D | undefined,
): BlinkerCallbacks | null {
  if (!left || !right) return null;

  const { inputs } = getGame();
  const isHeld = (name: string): boolean => inputs.actions.get(name)?.active ?? false;
  let isRunning = false;
  let isOn = false;
  const render = (): void => {
    left.visible = isHeld('left') ? isOn : false;
    right.visible = isHeld('right') ? isOn : false;
  };
  const blink = (): void => {
    isOn = !isOn;
    render();
    if (!isHeld('left') && !isHeld('right') && !isOn) isRunning = false;
    else gsap.delayedCall(BLINK_INTERVAL, blink);
  };
  const start = (action: { active: boolean }): void => {
    if (!action.active || isRunning) return;
    isRunning = true;
    isOn = true;
    render();
    gsap.delayedCall(BLINK_INTERVAL, blink);
  };
  inputs.events.on('left', start);
  inputs.events.on('right', start);
  return { left: start, right: start };
}
