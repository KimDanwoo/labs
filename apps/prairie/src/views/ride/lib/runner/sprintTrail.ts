import { SPRINT_TRAIL } from '@views/ride/model/runner/constants';
import { Object3D } from 'three';

export const { maxMotes } = SPRINT_TRAIL;

export const dummy = new Object3D();

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
