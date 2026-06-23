import { DataTexture, NearestFilter, RedFormat } from 'three';

// MeshToonMaterial은 기본 2톤. 4단 그라데이션 맵을 물려 지브리풍 밴딩(계단) 음영을 낸다.
const STEPS = new Uint8Array([96, 168, 224, 255]);

export const toonGradient = new DataTexture(STEPS, STEPS.length, 1, RedFormat);
toonGradient.minFilter = NearestFilter;
toonGradient.magFilter = NearestFilter;
toonGradient.generateMipmaps = false;
toonGradient.needsUpdate = true;
