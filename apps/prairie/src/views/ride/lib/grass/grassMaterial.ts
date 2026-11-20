import { FOG, SCENE_COLORS } from '@views/ride/config/scene';
import { gustOriginUniform, runnerXZUniform } from '@views/ride/lib/grass/grassField';
import { makeBladeGeometry } from '@views/ride/lib/makeBladeGeometry';
import { GRASS_QUALITY, GUST, type GrassQuality } from '@views/ride/model/grass/constants';
import { GRASS_FRAGMENT_SHADER, GRASS_VERTEX_SHADER } from '@views/ride/model/grass/shaders';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { Color, DoubleSide, ShaderMaterial, type BufferGeometry } from 'three';

export interface GrassCell {
  x: number;
  z: number;
}

const INITIAL_BRIGHTNESS = 0.95;
const NO_GUST = -1;

export function makeGrassMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRunnerXZ: { value: runnerXZUniform },
      uRunnerAir: { value: 0 },
      uGustOrigin: { value: gustOriginUniform },
      // 음수 = 돌풍 없음. 끝난 돌풍은 duration으로 잘라 무한대 유니폼을 피한다.
      uGustAge: { value: NO_GUST },
      uBrightness: { value: INITIAL_BRIGHTNESS },
      uGrassBase: { value: new Color(SCENE_COLORS.grassBase) },
      uGrassTip: { value: new Color(SCENE_COLORS.grassTip) },
      uGrassDry: { value: new Color(SCENE_COLORS.grassDry) },
      uHorizonColor: { value: new Color(SCENE_COLORS.fog) },
      uGroundColor: { value: new Color(SCENE_COLORS.grass) },
      uFogNear: { value: FOG.desktop.near },
      uFogFar: { value: FOG.desktop.far },
      uFadeNear: { value: GRASS_QUALITY.desktop.fadeNear },
      uFadeFar: { value: GRASS_QUALITY.desktop.fadeFar },
    },
    vertexShader: GRASS_VERTEX_SHADER,
    fragmentShader: GRASS_FRAGMENT_SHADER,
    side: DoubleSide,
  });
}

export function applyGrassQuality(material: ShaderMaterial, quality: GrassQuality): void {
  material.uniforms.uFadeNear!.value = GRASS_QUALITY[quality].fadeNear;
  material.uniforms.uFadeFar!.value = GRASS_QUALITY[quality].fadeFar;
  material.uniforms.uFogNear!.value = FOG[quality].near;
  material.uniforms.uFogFar!.value = FOG[quality].far;
}

export function updateGrassUniforms(material: ShaderMaterial, elapsed: number): void {
  material.uniforms.uTime!.value = elapsed;
  runnerXZUniform.set(runnerState.position.x, runnerState.position.z);
  material.uniforms.uRunnerAir!.value = runnerState.airborneHeight;
  gustOriginUniform.copy(runnerState.gustOrigin);
  const gustAge = runnerState.gustStartedAt < 0 ? NO_GUST : elapsed - runnerState.gustStartedAt;
  material.uniforms.uGustAge!.value = gustAge > GUST.duration ? NO_GUST : gustAge;
}

export function makeGrassGeometries(quality: GrassQuality): Map<number, BufferGeometry> {
  const map = new Map<number, BufferGeometry>();
  GRASS_QUALITY[quality].rings.forEach((lod) => {
    if (!map.has(lod.segments)) map.set(lod.segments, makeBladeGeometry(lod.segments));
  });
  return map;
}

export function gridCells(center: GrassCell, viewRadius: number): (GrassCell & { ring: number })[] {
  const list: (GrassCell & { ring: number })[] = [];
  for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
    for (let dz = -viewRadius; dz <= viewRadius; dz += 1) {
      list.push({ x: center.x + dx, z: center.z + dz, ring: Math.max(Math.abs(dx), Math.abs(dz)) });
    }
  }
  return list;
}
