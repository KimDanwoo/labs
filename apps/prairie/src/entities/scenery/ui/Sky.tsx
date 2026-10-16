'use client';

import { makeCloudTexture } from '@entities/scenery/model/services';
import { Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SCENE_COLORS, SUN } from '@shared/config';
import { useEffect, useMemo, useRef } from 'react';
import { BackSide, Color, Mesh, Vector3 } from 'three';

const CUBE_FACES = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
const VERTEX = `varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAGMENT = `
uniform vec3 uTop, uHorizon, uSun;
uniform sampler2D uClouds;
varying vec3 vDirection;
void main() {
  vec3 d = normalize(vDirection);
  float elevation = max(d.y, 0.0);
  vec3 color = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.45, elevation), 0.65));
  float sun = max(dot(d, uSun), 0.0);
  color += vec3(1.0, 0.54, 0.22) * pow(sun, 24.0) * 0.16;
  vec2 p = d.xz / (elevation + 0.24) * 0.13;
  float noise = texture2D(uClouds, p).r * 0.75 + texture2D(uClouds, p * 2.7 + 0.21).r * 0.25;
  float cloud = smoothstep(0.43, 0.64, noise) * smoothstep(0.02, 0.16, elevation);
  color = mix(color, mix(vec3(0.66, 0.73, 0.75), vec3(1.0, 0.91, 0.77), pow(sun, 6.0)), cloud * 0.78);
  float disc = smoothstep(cos(0.012), cos(0.009), sun);
  color += vec3(1.0, 0.77, 0.43) * (pow(sun, 360.0) * 0.32 + disc * 1.8) * (1.0 - cloud * 0.8);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function Sky() {
  const meshRef = useRef<Mesh>(null);
  const clouds = useMemo(() => makeCloudTexture(), []);
  useEffect(() => () => clouds.dispose(), [clouds]);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new Color(SCENE_COLORS.skyTop) },
      uHorizon: { value: new Color(SCENE_COLORS.skyBottom) },
      uSun: { value: new Vector3(...SUN.position).normalize() },
      uClouds: { value: clouds },
    }),
    [clouds],
  );
  useFrame(({ camera }) => meshRef.current?.position.copy(camera.position));
  return (
    <>
      <Environment background backgroundBlurriness={0.025} path="/assets/cubeMap/" files={CUBE_FACES} />
      <mesh ref={meshRef} renderOrder={-10}>
        <sphereGeometry args={[1100, 32, 16]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
