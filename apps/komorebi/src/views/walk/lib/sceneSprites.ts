import * as THREE from 'three';
import { FOREGROUNDS } from '../model/world/foreground';
import { DESTINATIONS } from '../model/world/landmarks';
import { REGION, type Region } from '../model/world/world';
import { canvasTexture } from './art';
import { BACKGROUND_FRAGMENT, BACKGROUND_VERTEX } from './backgroundShader';
import { SCENERY_STYLE } from './breeze';
import { lampUniforms } from './nightLights';
import { paintingToScene, sceneToUv, sceneX, sceneY } from './perspective';
import { createWaterMaps } from './water';

const SHADOW_ORDER = 3;
const MARKER_ORDER = 2;
const MARKER_SIZE = 1.7;
const MARKER_LIFT = 2;

export function createBackgroundMaterial(
  plate: THREE.Texture,
  region: Region,
  waterMaps: ReturnType<typeof createWaterMaps>,
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: plate },
      time: { value: 0 },
      evening: { value: 0 },
      night: { value: 0 },
      rain: { value: 0 },
      lamps: { value: lampUniforms(region).values },
      lampCount: { value: lampUniforms(region).count },
      walker: { value: new THREE.Vector2(0.5, 0.2) },
      waterMap: { value: waterMaps.of(region) },
      foam: waterMaps.foam,
      glitter: waterMaps.glitter,
      isSea: { value: region === REGION.coast ? 1 : 0 },
      isVillage: { value: region === REGION.village ? 1 : 0 },
      isHome: { value: region === REGION.home ? 1 : 0 },
      chalk: { value: null },
      hasChalk: { value: region === REGION.classroom ? 1 : 0 },
      outdoorRain: { value: 0 },
      sceneryStyle: { value: SCENERY_STYLE[region] },
      sceneryTime: { value: 0 },
      renderDpr: { value: 1 },
      fade: { value: 1 },
    },
    vertexShader: BACKGROUND_VERTEX,
    fragmentShader: BACKGROUND_FRAGMENT,
  });
}

export function createForegroundMaterial(background: THREE.ShaderMaterial) {
  const material = background.clone();
  material.uniforms = background.uniforms;
  material.transparent = true;
  material.depthTest = false;
  material.depthWrite = false;
  return material;
}

export function createForegrounds(scene: THREE.Scene, material: THREE.ShaderMaterial) {
  return FOREGROUNDS.map((layer) => {
    const shapes = (layer.pieces ?? [layer.outline]).map(
      (outline) => new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(...paintingToScene(x, y)))),
    );
    const geometry = new THREE.ShapeGeometry(shapes);
    const vertices = geometry.getAttribute('position');
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < vertices.count; i++) uv.setXY(i, ...sceneToUv(vertices.getX(i), vertices.getY(i)));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return { ...layer, mesh };
  });
}

export function createShadow(scene: THREE.Scene) {
  const texture = canvasTexture(128, 64, (c) => {
    const g = c.createRadialGradient(64, 32, 2, 64, 32, 53);
    g.addColorStop(0, '#17332b77');
    g.addColorStop(1, '#17332b00');
    c.fillStyle = g;
    c.scale(1, 0.5);
    c.fillRect(0, 0, 128, 128);
  });
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = SHADOW_ORDER;
  scene.add(sprite);
  return { sprite, material, texture };
}

export function createMarkerTexture() {
  return canvasTexture(64, 64, (c) => {
    c.strokeStyle = '#fff8ca';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(32, 9);
    c.lineTo(45, 32);
    c.lineTo(32, 55);
    c.lineTo(19, 32);
    c.closePath();
    c.stroke();
    c.fillStyle = '#ffefaa';
    c.beginPath();
    c.arc(32, 32, 3, 0, Math.PI * 2);
    c.fill();
  });
}

export function createDestinationMarkers(scene: THREE.Scene, map: THREE.Texture) {
  const materials = DESTINATIONS.map(() => new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
  const sprites = DESTINATIONS.map((p, i) => {
    const s = new THREE.Sprite(materials[i]);
    s.position.set(sceneX(p.x), sceneY(p.z) + MARKER_LIFT, 1);
    s.scale.set(MARKER_SIZE, MARKER_SIZE, 1);
    s.renderOrder = MARKER_ORDER;
    scene.add(s);
    return s;
  });
  return { sprites, materials };
}

export function createTargetMarker(scene: THREE.Scene, map: THREE.Texture) {
  const material = new THREE.SpriteMaterial({
    map,
    color: '#fff9cf',
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1, 1, 1);
  sprite.renderOrder = MARKER_ORDER;
  sprite.visible = false;
  scene.add(sprite);
  return { sprite, material };
}
