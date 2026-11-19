import {
  attribute,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  cross,
  float,
  floor,
  Fn,
  luminance,
  min,
  mix,
  modelWorldMatrix,
  mul,
  positionGeometry,
  positionWorld,
  step,
  uniform,
  varying,
  vec3,
  vec4,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { ANTICIPATION, ARC, EXPLOSION, type FloatUniform } from './lightningsConfig';

interface Palette {
  colorA: THREE.UniformNode<'color', THREE.Color>;
  colorB: THREE.UniformNode<'color', THREE.Color>;
  intensity: FloatUniform;
}

interface InstanceAttributes {
  position: THREE.Node<'vec3'>;
  scale: THREE.Node<'float'>;
}

function emissive(
  { colorA, colorB, intensity }: Palette,
  coordinates: THREE.Vector3,
  reach: number,
): THREE.Node<'vec3'> {
  const strength = positionWorld
    .sub(vec3(coordinates.x, coordinates.y, coordinates.z))
    .length()
    .div(reach)
    .min(1);
  const mixed = mix(colorA, colorB, strength);
  return mixed.div(luminance(mixed)).mul(intensity);
}

function arcVertex(startTime: FloatUniform): THREE.Node<'vec4'> {
  const { ticker } = getGame();
  return Fn(() => {
    const ratio = attribute('ratio', 'float');
    const tipness = step(ratio, 0.01);
    const timeProgress = min(ticker.elapsedScaledUniform.sub(startTime).div(ARC.duration), 1);
    const newPosition = positionGeometry.toVar();
    newPosition.xz.mulAssign(
      timeProgress
        .oneMinus()
        .pow(uniform(ARC.easeOut))
        .oneMinus()
        .mul(tipness.oneMinus())
        .mul(uniform(ARC.drift))
        .add(1),
    );
    const worldPosition = modelWorldMatrix.mul(vec4(newPosition, 1));
    const toCamera = worldPosition.xyz.sub(cameraPosition).normalize();
    const nextWorldPosition = modelWorldMatrix.mul(vec4(positionGeometry.add(attribute('direction', 'vec3')), 1));
    const nextDelta = nextWorldPosition.xyz.sub(worldPosition.xyz).normalize();
    const tangent = cross(nextDelta, toCamera).normalize();
    const finalThickness = mul(uniform(ARC.thickness), ratio.mul(10).min(1), timeProgress.oneMinus());
    const sideStep = floor(vertexIndex.toFloat().mul(3).sub(2).div(3).mod(2)).sub(0.5);
    worldPosition.addAssign(vec4(tangent.mul(sideStep.mul(finalThickness)), 0));
    return cameraProjectionMatrix.mul(cameraViewMatrix.mul(worldPosition));
  })();
}

export function anticipationMaterial(
  { colorB, intensity }: Palette,
  attributes: InstanceAttributes,
): THREE.SpriteNodeMaterial {
  const { ticker } = getGame();
  const startTime = uniform(ticker.elapsedScaled);
  const { position: positionAttribute, scale: scaleAttribute } = attributes;
  const finalPosition = varying(vec3());
  const localTime = ticker.elapsedScaledUniform.sub(startTime);

  const material = new THREE.SpriteNodeMaterial({ transparent: true });
  material.colorNode = colorB.div(luminance(colorB)).mul(intensity);
  material.positionNode = Fn(() => {
    finalPosition.assign(positionAttribute);
    const timeProgress = min(localTime.div(ANTICIPATION.duration), 1);
    finalPosition.y.addAssign(timeProgress.mul(uniform(ANTICIPATION.elevation)));
    return finalPosition;
  })();
  material.scaleNode = Fn(() => {
    const duration = float(ANTICIPATION.duration);
    const timeScale = localTime.remapClamp(duration.mul(0.5), duration, 1, 0);
    const elevationScale = finalPosition.y.remapClamp(0, 0.2, 0, 1);
    return scaleAttribute.mul(uniform(ANTICIPATION.scale)).mul(timeScale).mul(elevationScale);
  })();
  return material;
}

export function arcMaterial(palette: Palette, coordinates: THREE.Vector3): THREE.MeshBasicNodeMaterial {
  const startTime = uniform(getGame().ticker.elapsedScaled);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
  material.colorNode = emissive(palette, coordinates, ARC.colorReach);
  material.fog = false;
  material.vertexNode = arcVertex(startTime);
  return material;
}

export function explosionMaterial(
  palette: Palette,
  attributes: InstanceAttributes,
  coordinates: THREE.Vector3,
): THREE.SpriteNodeMaterial {
  const { ticker } = getGame();
  const startTime = uniform(ticker.elapsedScaled);
  const { position: positionAttribute, scale: scaleAttribute } = attributes;
  const localTime = ticker.elapsedScaledUniform.sub(startTime);

  const material = new THREE.SpriteNodeMaterial({ transparent: true });
  material.colorNode = emissive(palette, coordinates, EXPLOSION.colorReach);
  material.fog = false;
  material.positionNode = Fn(() => {
    const timeProgress = min(localTime.div(float(EXPLOSION.duration).mul(0.75)), 1);
    const newPosition = positionAttribute.toVar();
    newPosition.mulAssign(
      timeProgress.oneMinus().pow(uniform(EXPLOSION.easeOut)).oneMinus().mul(uniform(EXPLOSION.radius)),
    );
    return newPosition;
  })();
  material.scaleNode = Fn(() => {
    const timeScale = localTime.div(EXPLOSION.duration).oneMinus().max(0);
    return scaleAttribute.mul(uniform(EXPLOSION.scale)).mul(timeScale);
  })();
  return material;
}
