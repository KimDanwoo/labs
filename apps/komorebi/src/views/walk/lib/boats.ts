import * as THREE from 'three';
import { type Region, REGION } from '../model/world/world';
import { canvasTexture } from './art';
import { boatTexture } from './boatTexture';
import { lightSprite } from './nightLights';
import { sceneX, sceneY } from './perspective';

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
      if (!isStill && region === REGION.coast) clock += dt;
      for (const entry of boats) {
        const { route, boat, material, direction, wake, wakeMaterial, reflection, reflectionMaterial } = entry;
        entry.cabin.visible = boat.visible = wake.visible = reflection.visible = region === REGION.coast;
        if (!boat.visible) continue;
        const phase = (clock / route.duration + route.phase) % 1;
        const x = sceneX(THREE.MathUtils.lerp(route.from, route.to, phase));
        const bob = Math.sin(clock * 1.1 + route.phase * 12) * 0.1;
        const y = sceneY(route.z) + bob;
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
