'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { CINEMATIC } from '@shared/config';
import { boundedDpr } from '@shared/lib';
import { useEffect, useRef } from 'react';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// HDR 버퍼의 NaN·Inf 픽셀 하나를 bloom 블러가 넓게 번지게 해 화면이 검게 깜빡인다
const FINITE_COLOR_SHADER = {
  name: 'FiniteColorShader',
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      bool isBroken = any(isnan(color)) || any(isinf(color));
      gl_FragColor = isBroken ? vec4(0.0, 0.0, 0.0, 1.0) : color;
    }`,
};

export function SceneEffects({ enabled, pixels }: { enabled: boolean; pixels: number }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  const antialias = useRef<ShaderPass | null>(null);
  useEffect(() => {
    gl.domElement.setAttribute('data-render-mode', enabled ? 'cinematic' : 'direct');
    if (!enabled) return undefined;
    const pipeline = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(
      new Vector2(1, 1),
      CINEMATIC.bloom.strength,
      CINEMATIC.bloom.radius,
      CINEMATIC.bloom.threshold,
    );
    const output = new OutputPass();
    const smooth = new ShaderPass(FXAAShader);
    const finite = new ShaderPass(FINITE_COLOR_SHADER);
    pipeline.addPass(render);
    pipeline.addPass(finite);
    pipeline.addPass(bloom);
    // FXAA는 톤 매핑·sRGB 변환을 마친 최종 색에서 경계를 찾아야 한다
    pipeline.addPass(output);
    pipeline.addPass(smooth);
    const canvasSize = gl.getSize(new Vector2());
    const dpr = boundedDpr(canvasSize.x, canvasSize.y, gl.getPixelRatio(), pixels);
    pipeline.setPixelRatio(dpr);
    pipeline.setSize(canvasSize.x, canvasSize.y);
    smooth.uniforms.resolution!.value.set(1 / (canvasSize.x * dpr), 1 / (canvasSize.y * dpr));
    antialias.current = smooth;
    composer.current = pipeline;
    return () => {
      composer.current = null;
      antialias.current = null;
      render.dispose();
      bloom.dispose();
      output.dispose();
      smooth.dispose();
      finite.dispose();
      pipeline.dispose();
    };
  }, [gl, scene, camera, enabled, pixels]);
  useEffect(() => {
    const dpr = boundedDpr(size.width, size.height, viewport.dpr, pixels);
    composer.current?.setPixelRatio(dpr);
    composer.current?.setSize(size.width, size.height);
    antialias.current?.uniforms.resolution!.value.set(1 / (size.width * dpr), 1 / (size.height * dpr));
  }, [size.width, size.height, viewport.dpr, enabled, pixels]);
  useFrame((_, delta) => {
    if (composer.current) composer.current.render(delta);
    else gl.render(scene, camera);
  }, 1);
  return null;
}
