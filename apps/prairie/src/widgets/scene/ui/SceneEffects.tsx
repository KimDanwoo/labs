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
    pipeline.addPass(render);
    pipeline.addPass(bloom);
    pipeline.addPass(smooth);
    pipeline.addPass(output);
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
