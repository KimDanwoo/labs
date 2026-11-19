import * as THREE from 'three';
import { type Point, type Region, REGION } from '../model/world/world';
import { canvasTexture } from './art';
import { laundryTexture, sparrowTexture } from './countrysideTextures';
import { lightSprite } from './nightLights';
import { characterScale, sceneX, sceneY } from './perspective';
import { BIRD_STATE, startSparrow, stepSparrow } from './sparrows';

export function createCountryside(scene: THREE.Scene) {
  const time = { value: 0 };
  const clothGeometry = new THREE.PlaneGeometry(1, 1, 10, 12);
  const ropeTexture = canvasTexture(512, 256, (c) => {
    c.strokeStyle = '#6e6650';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(22, 238);
    c.lineTo(22, 25);
    c.moveTo(490, 238);
    c.lineTo(490, 25);
    c.stroke();
    c.lineWidth = 2;
    c.strokeStyle = '#b1a788';
    c.beginPath();
    c.moveTo(22, 39);
    c.quadraticCurveTo(256, 80, 490, 39);
    c.stroke();
  });
  const ropeMaterial = new THREE.SpriteMaterial({
    map: ropeTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const rope = new THREE.Sprite(ropeMaterial);
  rope.position.set(sceneX(42.5), sceneY(35.4), 0.5);
  rope.scale.set(8.6, 4.3, 1);
  rope.renderOrder = 2;
  scene.add(rope);
  const cloths = ['#f0edda', '#9cb6be', '#e3bd9e'].map((colour, i) => {
    const map = laundryTexture(colour, i === 1);
    const material = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.clothTime = time;
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', 'uniform float clothTime; void main() {')
        .replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          float freeEdge = 1. - uv.y;
          float gust = .55 + .45 * sin(clothTime * .43 + ${i.toFixed(1)});
          transformed.x += sin(clothTime * 1.6 + uv.y * 3. + ${i.toFixed(1)}) * freeEdge * freeEdge * .10 * gust;
          transformed.y += sin(clothTime * 2.1 + uv.x * 5. + ${i.toFixed(1)}) * freeEdge * .025;
        `,
        );
    };
    material.customProgramCacheKey = () => `village-cloth-${i}`;
    const mesh = new THREE.Mesh(clothGeometry, material);
    mesh.position.set(rope.position.x - 2.25 + i * 2.1, rope.position.y + 0.34, 0.6);
    mesh.scale.set(1.65, 2.05, 1);
    mesh.renderOrder = 2.1;
    scene.add(mesh);
    return { mesh, material, map };
  });
  const birdMaps = [sparrowTexture(0), sparrowTexture(1), sparrowTexture(-1)];
  const leftBirdMaps = birdMaps.map((map) => {
    const mirrored = map.clone();
    mirrored.repeat.x = -1;
    mirrored.offset.x = 1;
    return mirrored;
  });
  const birdHomes: { region: Region; ground: Point; perch: Point }[] = [
    { region: 'village', ground: { x: 30.5, z: 47 }, perch: { x: 22, z: 31 } },
    { region: 'village', ground: { x: 33, z: 47.7 }, perch: { x: 24, z: 29 } },
    { region: 'village', ground: { x: 49.5, z: 60 }, perch: { x: 40.7, z: 48 } },
    { region: 'school', ground: { x: 37, z: 49 }, perch: { x: 25, z: 28 } },
    { region: 'school', ground: { x: 40, z: 51 }, perch: { x: 28, z: 26 } },
    { region: 'shops', ground: { x: 48, z: 59 }, perch: { x: 34, z: 42 } },
    { region: 'shops', ground: { x: 51, z: 58 }, perch: { x: 64, z: 31 } },
    { region: 'river', ground: { x: 21, z: 49 }, perch: { x: 31, z: 30 } },
    { region: 'forest', ground: { x: 42, z: 70 }, perch: { x: 25, z: 50 } },
    { region: 'forest', ground: { x: 46, z: 72 }, perch: { x: 76, z: 44 } },
  ];
  const birds = birdHomes.map(({ region, ground, perch }, i) => {
    const bird = startSparrow(ground, perch, i * 1.3 + 0.2);
    const material = new THREE.SpriteMaterial({
      map: birdMaps[0],
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.center.set(0.5, 0.12);
    sprite.renderOrder = 3.6;
    scene.add(sprite);
    return { region, bird, sprite, material, facingLeft: false, opacity: 0 };
  });
  return {
    update({
      region,
      dt,
      darkness,
      isStill,
      isRaining,
      player,
    }: {
      region: Region;
      dt: number;
      darkness: number;
      isStill: boolean;
      isRaining: boolean;
      player: Point;
    }) {
      const visible = region === REGION.village;
      if (visible && !isStill) time.value += dt;
      rope.visible = visible;
      lightSprite(ropeMaterial.color, darkness, 0);
      for (const { mesh, material } of cloths) {
        mesh.visible = visible;
        lightSprite(material.color, darkness, 0.08);
      }
      for (const entry of birds) {
        const { region: birdRegion, bird, sprite, material } = entry;
        if (birdRegion !== region) {
          sprite.visible = false;
          entry.opacity = 0;
          continue;
        }
        const targetOpacity = isRaining ? 0 : 1 - THREE.MathUtils.smoothstep(darkness, 0.3, 0.65);
        entry.opacity = isStill ? targetOpacity : THREE.MathUtils.damp(entry.opacity, targetOpacity, 3, dt);
        sprite.visible = entry.opacity > 0.005;
        if (!sprite.visible) continue;
        const previousX = bird.at.x;
        if (!isStill && dt > 0) stepSparrow(bird, player, dt);
        if (Math.abs(bird.at.x - previousX) > 0.0005) entry.facingLeft = bird.at.x < previousX;
        const flying = bird.state === BIRD_STATE.flying || bird.state === BIRD_STATE.returning;
        material.map = (entry.facingLeft ? leftBirdMaps : birdMaps)[flying ? 1 + (Math.floor(bird.age * 12) % 2) : 0]!;
        const height = characterScale(bird.at.z) * 2.7;
        const peck = !flying && (bird.age + bird.seed) % 3.7 > 3.3;
        material.rotation = Number(peck) * (entry.facingLeft ? 0.22 : -0.22);
        sprite.scale.set(height * 1.33, height, 1);
        sprite.position.set(sceneX(bird.at.x), sceneY(bird.at.z) + bird.lift, 0.7);
        material.opacity = entry.opacity;
        lightSprite(material.color, darkness, 0);
      }
    },
    dispose() {
      scene.remove(rope);
      ropeMaterial.dispose();
      ropeTexture.dispose();
      clothGeometry.dispose();
      for (const { mesh, material, map } of cloths) {
        scene.remove(mesh);
        material.dispose();
        map.dispose();
      }
      for (const { sprite, material } of birds) {
        scene.remove(sprite);
        material.dispose();
      }
      [...birdMaps, ...leftBirdMaps].forEach((map) => map.dispose());
    },
  };
}
