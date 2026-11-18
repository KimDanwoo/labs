import { MAP_SCALE } from '../config/map';

export const mapX = (x: number) => x * MAP_SCALE.x;
export const mapY = (z: number) => z * MAP_SCALE.y;
