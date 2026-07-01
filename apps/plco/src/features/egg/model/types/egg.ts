import { EGG_PHASE } from '../constants/egg';

export type EggPhase = (typeof EGG_PHASE)[keyof typeof EGG_PHASE];
