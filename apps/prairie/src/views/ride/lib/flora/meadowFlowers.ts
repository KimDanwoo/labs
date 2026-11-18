import { Color } from 'three';

export const COLORS = ['#f7eac2', '#ead2a2', '#b9add9', '#e2d8f2'].map((hex) => new Color(hex));

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const TILE = 16;
