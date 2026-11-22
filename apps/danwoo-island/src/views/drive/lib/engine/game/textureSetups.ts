import * as THREE from 'three/webgpu';

type TextureSetup = (texture: THREE.Texture) => void;

export const withSetups =
  (...setups: TextureSetup[]): TextureSetup =>
  (texture) => {
    for (const setup of setups) setup(texture);
  };

export const nearest: TextureSetup = (texture) => {
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
};

export const linear: TextureSetup = (texture) => {
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
};

export const repeat: TextureSetup = (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
};

export const srgb: TextureSetup = (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
};

export const unflipped: TextureSetup = (texture) => {
  texture.flipY = false;
};

export const halfWidth: TextureSetup = (texture) => {
  texture.repeat.x = 0.5;
};
