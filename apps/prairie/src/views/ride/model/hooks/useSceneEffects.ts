import { useThree } from '@react-three/fiber';
import { boundedDpr } from '@shared/lib/renderBudget';
import { useEffect, useRef, type RefObject } from 'react';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { CINEMATIC } from '../../config/scene';
import { FINITE_COLOR_SHADER } from '../../lib/scene/sceneEffects';

export function useSceneEffects(enabled: boolean, pixels: number): RefObject<EffectComposer | null> {
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
  return composer;
}
