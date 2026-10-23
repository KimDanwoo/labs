import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { lightSprite } from './nightLights';

/** A small coastal fishing boat, painted at high resolution for a soft distant silhouette. */
function boatTexture(isFerry: boolean) {
  return canvasTexture(512, 256, (c) => {
    const shape = (fill: string, points: number[][]) => {
      c.beginPath();
      points.forEach(([x, y]) => c.lineTo(x!, y!));
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    };
    const line = (colour: string, width: number, points: number[][]) => {
      c.beginPath();
      points.forEach(([x, y]) => c.lineTo(x!, y!));
      c.strokeStyle = colour;
      c.lineWidth = width;
      c.stroke();
    };
    c.lineJoin = 'round';
    // Hull faces and a darker waterline give the boat volume at a small screen size.
    shape('#294d58', [
      [62, 191],
      [444, 179],
      [408, 219],
      [111, 225],
      [78, 210],
    ]);
    const hull = c.createLinearGradient(0, 165, 0, 224);
    hull.addColorStop(0, '#fff4d6');
    hull.addColorStop(0.55, '#d6ded2');
    hull.addColorStop(1, '#779eaa');
    c.fillStyle = hull;
    c.beginPath();
    c.moveTo(58, 175);
    c.lineTo(454, 162);
    c.lineTo(419, 200);
    c.quadraticCurveTo(244, 226, 102, 205);
    c.closePath();
    c.fill();
    line('#567b83', 6, [
      [78, 190],
      [248, 199],
      [433, 181],
    ]);
    shape('#8f6650', [
      [89, 170],
      [406, 160],
      [449, 164],
      [251, 185],
      [62, 180],
    ]);
    const left = isFerry ? 117 : 220;
    shape('#d9ded0', [
      [left, 165],
      [left, 116],
      [342, 109],
      [358, 167],
    ]);
    shape('#f5edce', [
      [left, 116],
      [left + 20, 104],
      [329, 100],
      [342, 109],
    ]);
    shape('#94b0ac', [
      [342, 109],
      [363, 121],
      [375, 164],
      [358, 167],
    ]);
    for (let x = left + 12; x < 328; x += 35) {
      shape('#285969', [
        [x, 123],
        [x + 24, 121],
        [x + 26, 147],
        [x, 149],
      ]);
      line('#a2cbd0', 2, [
        [x + 3, 125],
        [x + 20, 124],
      ]);
    }
    shape('#365f6b', [
      [348, 121],
      [358, 127],
      [364, 146],
      [352, 147],
    ]);
    line('#586f68', 4, [
      [277, 104],
      [275, 42],
      [312, 54],
    ]);
    line('#6b817a', 2, [
      [275, 62],
      [161, 167],
      [276, 85],
      [402, 161],
    ]);
    shape('#bd654d', [
      [279, 45],
      [310, 50],
      [280, 58],
    ]);
    line('#f0e9d2', 3, [
      [89, 172],
      [85, 151],
      [211, 148],
    ]);
    for (const x of [97, 136, 177, 211, 387, 416]) {
      line('#dbdec9', 2, [
        [x, 151],
        [x, 172],
      ]);
    }
    for (const x of [133, 199, 354]) {
      c.fillStyle = '#3a5355';
      c.beginPath();
      c.ellipse(x, 195, 8, 12, 0.1, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#8caca6';
      c.beginPath();
      c.ellipse(x, 195, 3, 6, 0.1, 0, Math.PI * 2);
      c.fill();
    }
  });
}

const ROUTES = [
  { from: 72, to: 105, z: 29, width: 5.5, duration: 105, phase: 0.32, ferry: false },
  { from: 103, to: 70, z: 23.5, width: 3.7, duration: 138, phase: 0.68, ferry: true },
];
const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export function createBoats(scene: THREE.Scene) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const boats = ROUTES.map((route) => {
    const map = boatTexture(route.ferry);
    const material = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, depthWrite: false });
    const windows = canvasTexture(512, 256, (c) => {
      c.fillStyle = '#ffcb77';
      c.shadowColor = '#ffb84d';
      c.shadowBlur = 7;
      for (let x = route.ferry ? 129 : 232; x < 328; x += 35) c.fillRect(x, 124, 20, 20);
    });
    const cabinMaterial = new THREE.SpriteMaterial({
      map: windows,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    windows.center.set(0.5, 0.5);
    windows.repeat.x = Math.sign(route.to - route.from);
    const cabin = new THREE.Sprite(cabinMaterial);
    cabin.center.set(0.5, 0.16);
    cabin.renderOrder = 1.6;
    const boat = new THREE.Sprite(material);
    boat.center.set(0.5, 0.16);
    boat.renderOrder = 1.5;
    const direction = Math.sign(route.to - route.from);
    map.center.set(0.5, 0.5);
    map.repeat.x = direction;
    const wakeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { time: { value: 0 }, opacity: { value: 0 }, direction: { value: direction }, night: { value: 0 } },
      vertexShader,
      fragmentShader: `
        varying vec2 vUv; uniform float time, opacity, direction, night;
        void main() {
          float x = direction > 0. ? vUv.x : 1. - vUv.x;
          float age = 1. - x;
          float y = abs(vUv.y - .5);
          float edge = .035 + age * .37;
          float ripples = .5 + .5 * sin(age * 83. - time * 3.8 + sin(vUv.y * 41.));
          float arms = exp(-pow((y - edge) / (.012 + age * .025), 2.));
          float churn = exp(-y * 24.) * (.35 + .65 * ripples);
          float fade = smoothstep(0., .12, x) * smoothstep(0., .10, age);
          float alpha = (arms * (.3 + ripples * .7) + churn * .38) * fade * x * opacity;
          gl_FragColor = vec4(mix(vec3(.83, .95, .91), vec3(.19, .34, .43), night), alpha);
        }`,
    });
    const wake = new THREE.Mesh(geometry, wakeMaterial);
    wake.renderOrder = 1.2;
    const reflectionMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { map: { value: map }, time: { value: 0 }, opacity: { value: 0 }, direction: { value: direction } },
      vertexShader,
      fragmentShader: `
        varying vec2 vUv; uniform sampler2D map; uniform float time, opacity, direction;
        void main() {
          vec2 uv = vec2(vUv.x, 1. - vUv.y);
          uv.x += sin(vUv.y * 65. - time * 2.1) * .018;
          if (direction < 0.) uv.x = 1. - uv.x;
          vec4 ink = texture2D(map, uv);
          float bands = .5 + .5 * sin(vUv.y * 103. - time * 2.7);
          gl_FragColor = vec4(ink.rgb * vec3(.42, .64, .7), ink.a * opacity * vUv.y * (.25 + .75 * bands));
        }`,
    });
    const reflection = new THREE.Mesh(geometry, reflectionMaterial);
    reflection.renderOrder = 1.3;
    scene.add(wake, reflection, boat, cabin);
    return {
      cabin,
      cabinMaterial,
      windows,
      route,
      boat,
      material,
      map,
      wake,
      wakeMaterial,
      reflection,
      reflectionMaterial,
      direction,
    };
  });
  let clock = 0;
  return {
    update({ region, dt, darkness, isStill }: { region: Region; dt: number; darkness: number; isStill: boolean }) {
      if (!isStill && region === 'coast') clock += dt;
      for (const entry of boats) {
        const { route, boat, material, direction, wake, wakeMaterial, reflection, reflectionMaterial } = entry;
        entry.cabin.visible = boat.visible = wake.visible = reflection.visible = region === 'coast';
        if (!boat.visible) continue;
        const phase = (clock / route.duration + route.phase) % 1;
        const x = THREE.MathUtils.lerp(route.from, route.to, phase) * 1.2 - 60;
        const bob = Math.sin(clock * 1.1 + route.phase * 12) * 0.1;
        const y = 40 - route.z * 0.8 + bob;
        const fade = THREE.MathUtils.smoothstep(phase, 0, 0.08) * (1 - THREE.MathUtils.smoothstep(phase, 0.9, 1));
        boat.position.set(x, y, 0.6);
        boat.scale.set(route.width, route.width * 0.5, 1);
        material.rotation = Math.sin(clock * 0.83 + route.phase * 9) * 0.018;
        material.opacity = fade;
        lightSprite(material.color, darkness, 0);
        material.color.multiplyScalar(1 - darkness * 0.3);
        entry.cabin.position.copy(boat.position);
        entry.cabin.scale.copy(boat.scale);
        entry.cabinMaterial.rotation = material.rotation;
        entry.cabinMaterial.opacity = darkness * fade * 0.8;
        wake.position.set(x - direction * route.width * 0.95, y - 0.06, 0.5);
        wake.scale.set(route.width * 1.7, route.width * 0.3, 1);
        wakeMaterial.uniforms.time!.value = clock;
        wakeMaterial.uniforms.opacity!.value = fade * 0.55;
        wakeMaterial.uniforms.night!.value = darkness;
        reflection.position.set(x, y - route.width * 0.15, 0.5);
        reflection.scale.set(route.width, route.width * 0.34, 1);
        reflectionMaterial.uniforms.time!.value = clock;
        reflectionMaterial.uniforms.opacity!.value = fade * 0.32 * (1 - darkness * 0.7);
      }
    },
    dispose() {
      for (const {
        boat,
        wake,
        reflection,
        material,
        map,
        wakeMaterial,
        reflectionMaterial,
        cabin,
        cabinMaterial,
        windows,
      } of boats) {
        scene.remove(boat, wake, reflection, cabin);
        cabinMaterial.dispose();
        windows.dispose();
        material.dispose();
        map.dispose();
        wakeMaterial.dispose();
        reflectionMaterial.dispose();
      }
      geometry.dispose();
    },
  };
}
